Most web apps need some form of authorization. It can be time consuming to research different methods like RBAC, ABAC, ACL, etc.

In the early days to save time, most engineers opt out of a framework and write ad-hoc authorization checks. It works in the moment, but as the project grows there will be too much code and too many database tables for the same concepts.

For large projects with multiple services, open source implementations of [Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/) like [SpiceDB](https://authzed.com/) and [Keto](https://www.ory.sh/keto/) are popular. The benefit is a scalable framework for authorization, but it requires operating a dedicated service which is often too much work for small projects.

I took a look at the implementation. The core data model for the authorization graph is pretty simple. Most of the code is for scaling reads, exposing a service, and managing policy files in a domain specific language. For small projects, it can work to copy the storage format of Zanzibar in the primary database.

### Authorization Graph

The way these services work is modeling authorization as a graph. The resources and subjects are nodes. The relations between them are edges. To make it more concrete, we can discuss the authorization graph for a productivity app.

- The only subject is a **User**. There are no service accounts or anonymous users.
- The resources are **Project**, **Team**, and **Todo**.
- The relations are **Contributor** for a user on a team, and **Owner** for a team that owns a project.

The graph is represented as relation tuples. There are two kinds of relation tuples, static and dynamic. The static tuple is for granting a relation for a subject on a resource.

> _User `f07a345c-a360-49ca-9f25-1941be1065fa` is a `Contributor` on Team `29c47778-6aa6-4437-969e-8b8c5623df75`_

The dynamic tuple is for granting a set of subjects a relation on a resource if they have a relation for a different resource.

> _Every `Contributor` for Team `29c47778-6aa6-4437-969e-8b8c5623df75` is an `Owner` for Project `f52259db-a3e4-4568-944c-42ee8f397a9d`_

The design is clever. It allows you to model relationships in a simple way. For example, if you add a new contributor on the team, they automatically become an owner of the project.

> _User `0a661faf-420f-4a0f-8018-a2671eb84047` is a `Contributor` on Team `29c47778-6aa6-4437-969e-8b8c5623df75`_

It also works for tiered assignments in a hierarchy. It can get as nested as required.

> _User `858f4d71-7542-4ed4-aa64-a7c5a8cf0cf8` is a `Contributor` for Team `afc9539b-1901-49c4-8132-cb542e747337`_

> _Every `Contributor` for Team `afc9539b-1901-49c4-8132-cb542e747337` is a `Contributor` on Team `29c47778-6aa6-4437-969e-8b8c5623df75`_

The authorization logic in the application checks if a subject has a relation for a resource. It requires expanding the dynamic sets to get the computed relations for a resource.

> _Check if User `858f4d71-7542-4ed4-aa64-a7c5a8cf0cf8` is an `Owner` for Project `f52259db-a3e4-4568-944c-42ee8f397a9d`_

In this example check, the user is a contributor on a team, the team is part of another team, and anyone on that team is the owner of the project, so the authorization passes.

### Relation Tuples

The storage layout for relation tuples in PostgreSQL is a single table. The resource is represented as a string for the type and ID, the relation is a string that can be reused across different resource types, the subject is either a static ID or a reference to another resource and relation.

```sql
create table relation_tuples (
  resource_type text not null,
  resource_id uuid not null,
  relation text not null,
  subject_id uuid,
  subject_set_resource_type text,
  subject_set_resource_id uuid,
  subject_set_relation text
)
```

The example above can be inserted into the table.

```sql
insert into relation_tuples (
  resource_type,
  resource_id,
  relation,
  subject_id,
  subject_set_resource_type,
  subject_set_resource_id,
  subject_set_relation
) values (
  'Team',
  '29c47778-6aa6-4437-969e-8b8c5623df75',
  'Contributor',
  'f07a345c-a360-49ca-9f25-1941be1065fa',
  null,
  null,
  null
), (
  'Team',
  '29c47778-6aa6-4437-969e-8b8c5623df75',
  'Contributor',
  '0a661faf-420f-4a0f-8018-a2671eb84047',
  null,
  null,
  null
), (
  'Project',
  'f52259db-a3e4-4568-944c-42ee8f397a9d',
  'Owner',
  null,
  'Team',
  '29c47778-6aa6-4437-969e-8b8c5623df75',
  'Contributor'
), (
  'Team',
  'afc9539b-1901-49c4-8132-cb542e747337',
  'Contributor',
  '858f4d71-7542-4ed4-aa64-a7c5a8cf0cf8',
  null,
  null,
  null
), (
  'Team',
  '29c47778-6aa6-4437-969e-8b8c5623df75',
  'Contributor',
  null,
  'Team',
  'afc9539b-1901-49c4-8132-cb542e747337',
  'Contributor'
);
```

### Recursive Query

The challenge with querying is that relation tuples need to be expanded to know the computed relations for a given subject and resource. In PostgreSQL you can do a [recursive query](https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-RECURSIVE) to have the database do the work. It can also work to query in a loop in application code.

```sql
with recursive flat_relation_tuples as (
  select * from relation_tuples
  union
  select
    a.resource_type,
    a.resource_id,
    a.relation,
    b.subject_id,
    b.subject_set_resource_type,
    b.subject_set_resource_id,
    b.subject_set_relation
  from flat_relation_tuples a
  inner join relation_tuples b
    on a.subject_set_resource_type = b.resource_type
    and a.subject_set_resource_id = b.resource_id
    and a.subject_set_relation = b.relation
  where a.subject_id is null
)
```

For the example authorization graph, the expanded roles are the following.

```sql
select resource_type, resource_id, relation, subject_id
from flat_relation_tuples
where subject_id is not null;
```

| resource_type | resource_id                          | relation    | subject_id                           |
| ------------- | ------------------------------------ | ----------- | ------------------------------------ |
| Team          | 29c47778-6aa6-4437-969e-8b8c5623df75 | Contributor | f07a345c-a360-49ca-9f25-1941be1065fa |
| Team          | 29c47778-6aa6-4437-969e-8b8c5623df75 | Contributor | 0a661faf-420f-4a0f-8018-a2671eb84047 |
| Team          | afc9539b-1901-49c4-8132-cb542e747337 | Contributor | 858f4d71-7542-4ed4-aa64-a7c5a8cf0cf8 |
| Project       | f52259db-a3e4-4568-944c-42ee8f397a9d | Owner       | f07a345c-a360-49ca-9f25-1941be1065fa |
| Project       | f52259db-a3e4-4568-944c-42ee8f397a9d | Owner       | 0a661faf-420f-4a0f-8018-a2671eb84047 |
| Team          | 29c47778-6aa6-4437-969e-8b8c5623df75 | Contributor | 858f4d71-7542-4ed4-aa64-a7c5a8cf0cf8 |
| Project       | f52259db-a3e4-4568-944c-42ee8f397a9d | Owner       | 858f4d71-7542-4ed4-aa64-a7c5a8cf0cf8 |

To query the relations between a subject and resource, pass in a filter.

```sql
select relation
from flat_relation_tuples
where subject_id = '858f4d71-7542-4ed4-aa64-a7c5a8cf0cf8'
and resource_id = 'f52259db-a3e4-4568-944c-42ee8f397a9d';
```

### Auth Framework

It can work well to store the relation tuple at the same time as creating, updating, or deleting resources. For example, when a user joins a team, the application can store a relation tuple in single transaction. When a project is deleted, any relation tuples that reference the project can be deleted in the same transaction.

The authorization code in the application can check if a subject (the signed in user) has the required relations for the resource.

```python
@post("/projects/{project_id}/todos")
async def create_todo(project_id: UUID, claims = Depends(verify_jwt)):
    await authorize(claims['sub'], project_id, "Contributor")

    # ...
```

The benefit of using the Zanzibar data model from the start is twofold. It gives you a battle tested interface that can handle future complexity. It also makes it easier to switch to a dedicated auth service in the future to scale up.
