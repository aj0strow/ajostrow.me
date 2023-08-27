This article is about building out a redux store in TypeScript.

> _Update - Please see [Redux Revisited](/articles/redux-revisited)._

### Redux Types

Redux is a javascript library without types, so you need to write your own.

```
store
└── typings.ts
```

Redux actions are plain JavaScript objects. I use flux standard actions format.

```ts
export interface Action<T> {
  type: string
  payload: T
  error?: any
}
```

Redux reducer functions receives the current state and an action, and returns the next state. The store will dispatch every action to every reducer, so it must accept a generic `Action<any>`.

```ts
export interface Reducer<T> {
  (state: T, action: Action<any>): T
}
```

That's pretty much it, `Action<T>` and `Reducer<T>`. Async is covered below.

### Domain Models

These are primary models for your application. Your views should accept domain models as parameters, and use the properties to render. They define _what_ your redux store holds.

You can either use implicit interface types with plain javascript objects or classes.

```ts
// implicit interface

interface User {
  id: string
  name: string
}

// explicit class

class User {
  id: string
  name: string

  constructor(props: User) {
    Object.assign(this, props)
  }
}
```

I would encourage interfaces so it's easy to serialize and hydrate the store. The downside is no instance methods.

### Redux Store

Redux stores are usually designed like relational databases.

```js
{
    users: {
        "1": {
            id: "1",
            name: "ajostrow",
        },
    },
}
```

Sometimes you want "denormalized indexes" for fast lookup.

```js
{
    users: {
        byId: {
            "1": {
                id: "1",
                name: "ajostrow",
            },
        },
        byName: {
            "ajostrow": {
                id: "1",
                name: "ajostrow",
            }
        }
    }
}
```

Sometimes you want "shallow indexes" to conserve space when serializing and hydrating the store.

```js
{
    users: {
        userTable: {
            "1": {
                id: "1",
                name: "ajostrow",
            }
        },
        nameIndex: {
            "ajostrow": "1",
        },
    },
}
```

The guiding rule is to design the store to make selectors fast.

```js
function getUserById(state, id) {
  return state.users.userTable[id]
}

function getUserByNickname(state, name) {
  return getUserById(state.users.nameIndex[name])
}
```

I keep ephemeral state local to the component. It's too much work managing loading indicators within the redux store for my use case.

### Module Layout

Your redux state code belongs in one source directory. Each resource (or "table") should be in it's own child directory.

```
store
├── users
├── posts
└── comments
```

Each resource needs to create actions with strong types, define state models, reduce actions into state models, and select state models from the complete store.

```
store
├── users
│   ├── actions.ts
│   ├── state.ts
│   ├── reducers.ts
│   ├── selectors.ts
│   └── index.ts
  
```

### Actions

Each action represents an event that _happened_. Redux is synchronous event sourcing, so I use naming conventions consistent with Apache Kafka.

```
{ResourceName}{PastTenseVerb}
```

For example:

```
UserCreated
```

In code, the redux convention is to use `UPPER_SNAKE_CASE` for action types. I'll add a second convention to use `UpperCamelCase` for payload interfaces.

```ts
// store/user/actions.ts

import { User } from 'models'

export const USER_CREATED = 'UserCreated'

export interface UserCreated {
  user: User
}
```

You can use the type and payload to write out an action.

```js
const userCreated: Action<UserCreated> = {
  type: USER_CREATED,
  payload: {
    user: {
      id: '1',
      name: 'ajostrow',
    },
  },
}
```

### State Models

I went over redux store design above. Here you write the structure in code.

```ts
// store/users/state.ts

import { User } from 'models'

export interface Table<T> {
  [pk: string]: T
}

export interface UserTable extends Table<User> {}

export interface NameIndex extends Table<string> {}

export interface Users {
  userTable: UserTable
  nameIndex: NameIndex
}
```

In your main store, include users.

```ts
// store/state.ts

import { Users } from './users/state'

export interface ReduxStore {
  users: Users
}
```

### Reducers

Each reducer function represents a single data structure. You combine reducers to eventually compose the complete store state. A guiding rule is to never set a property more than one level deep.

When you write reducers in JavaScript, usually you check the `type` property, and if it matches you assume the payload contains specific data.

```js
function reducer(state, action) {
  if (action.type == 'ACTION_TYPE') {
    // do something with action.payload
  }
}
```

TypeScript complains because we can't just assume the type `any` contains specific data. Instead use a _User-Defined Type Guard_ which casts `Action<any>` to a strongly typed action.

```ts
// store/typings.ts

export function isType<T>(
  action: Action<any>,
  type: string
): action is Action<T> {
  return action.type === type
}
```

In the reducer function, use strong type checks.

```ts
// store/users/reducers.ts

import { Reducer, isType } from 'store/typings'

import { USER_CREATED, UserCreated } from './actions'

import { Users, UserTable, NameIndex } from './state'

export const users: Reducer<Users> = (state, action) => {
  return {
    userTable: userTable(state.userTable, action),
    nameIndex: nameIndex(state.nameIndex, action),
  }
}

export const userTable: Reducer<UserTable> = (state = {}, action) => {
  if (isType<UserCreated>(action.type, USER_CREATED)) {
    const { user } = action.payload
    return Object.assign({}, state, { [user.id]: user })
  }
  return state
}

export const nameIndex: Reducer<NameIndex> = (state = {}, action) => {
  if (isType<UserCreated>(action.type, USER_CREATED)) {
    const { user } = action.payload
    return Object.assign({}, state, { [user.name]: user.id })
  }
  return state
}
```

The important principle of pure reducers is they remain isolated. I can add more state data and more nesting to the main `users` state without changing the `nameIndex` reducer. This design _scales_.

### Selectors

The purpose of selectors is to have one authoritative reference to where in the state tree a piece of data lives. Start with a state selector from the root store selectors module and then build more useful selectors out of it.

```ts
// store/users/selectors.ts

import { createSelector } from 'reselect'
import { getUsers } from 'store/selectors'
import { Selector, Users, UserTable } from './state'

export const getUserTable: Selector<UserTable> = createSelector(
  [getUsers],
  (users) => {
    return users.userTable
  }
)
```

You can save a lot of headache if you name route parameters consistently, and keep route params in your redux store. Then you can fetch the current resource for the page.

```ts
// store/users/selectors.ts

import { getRouteParams } from 'store/route/index'
import { User } from 'models'

export const getCurrentUser: Selector<User> = createSelector(
  [getUserTable, getRouteParams],
  (userTable, params) => {
    return userTable[params.user]
  }
)
```

### Async Actions

I use `redux-thunk` for async middleware. It allows you to dispatch a function instead of a flux standard action.

```ts
// store/typings.ts

type ReduxAction<T> = Action<T> | ThunkAction<T>

interface ThunkAction<T> {
  (dispatch: Dispatch<T>): any
}

export interface Dispatch<T> {
  (action: ReduxAction<T>): void
}
```

Writing async action creators is a breeze with arrow syntax.

```ts
// store/users/actions.ts

import { Dispatch } from 'store/typings'

export const createUser =
  (form: any) =>
  (dispatch: Dispatch<UserCreated>): Promise<User> => {
    return api.createUser(form).then((user) => {
      dispatch({
        type: USER_CREATED,
        payload: { user },
      })
      return user
    })
  }
```

If you need to dispatch multiple action types, you can relax the payload interface using a union type.

```ts
type CreateUserAction = CreateUserRequestSent | UserCreated | CreateUserRejected

Dispatch<CreateUserAction>
```

If you find yourself dispatching action creators inside action creators, it may be more appropriate to use middleware within the store dispatch process to listen for events and run a handler, like `redux-saga` does.

### Summary

In summary, your redux store is a client side database. Action creators are past tense event producers with payloads comtaining domain models. Reducers represent one discrete data structure, mapping a series of actions to the current state. Selectors are database queries that return domain models from the store.

Thanks for reading, and keep warm. 🇨🇦
