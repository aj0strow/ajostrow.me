In React apps, keeping track of state for async requests can require a lot of boilerplate code. At work [Tejus](https://github.com/vijedi) showed me a library `react-query` that reduces this biolerplate with query and mutation hooks. 

It did not immediately click. I thought `react-query` was only for fetching immutable data which is not very helpful. It turns there are multiple hooks that when used together provide a complete solution for fetching and modifying data. 

> In most applications there is a helper method that wraps the Fetch API to make HTTP requests with auth, convert errors, and return JSON data. In this article the example code will assume this helper method is called `apiFetch`. 

### Fetching Data Biolerplate

The default way to fetch data in React is with state and effect hooks. 

```ts
const [data, setData] = useState<ModelJSON | null>(null);

useEffect(() => {
  apiFetch(`/models/${id}`).then(data => {
    setData(data);
  });
}, [id]);
```

Most apps need to keep track of a loading state to render a progress indicator. Some apps need to keep track of error state to render inline error messages. In addition, the effect needs to keep track of effect cleanup for a couple reasons. 
* If the effect has a resource identifier in the hook deps, if the page changes and the request for the previous identifier takes longer than the request for the next identifier, it could result in setting state for the wrong page. 
  
  > Visit page `A25` → Request `A25` → Visit page `B14` → Request `B14` → Response `B14` → Response `A25`
* Updating state for unmounted components triggers a warning. See article [React state update on an unmounted component](https://www.debuggr.io/react-update-unmounted-component/). 

  > Visit page `A25` → Request `A25`→ Visit contact page → Response `A25` 

Example code for keeping track of async state and aborting. 

```js
const [loading, setLoading] = useState<boolean>(true);
const [data, setData] = useState<ModelJSON | null>(null);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  setLoading(true);
  setData(null);
  setError(null);

  let aborted = false;
  const effect = async () => {
    try {
      const data = await apiFetch(`/models/${id}`);
      if (!aborted) {
        setData(data);
      }
    } catch (e) {
      if (!aborted) {
        setError(e);
      }
    } finally {
      if (!aborted) {
        setLoading(false);
      }
    }
  };

  effect();

  return () => {
    aborted = true;
  };
}, [id]);
```

The majority of this code is boilerplate that applies to fetching data for any resource.  

### React Query Fetching

The `react-query` library provides a `useQuery` hook for fetching data. It includes loading and error state. See the [documentation for useQuery](https://react-query.tanstack.com/reference/useQuery) for a full list of features. 

```jsx
const modelQuery = useQuery(['model', id], () => {
  return apiFetch(`/models/${id}`);
});

// in the render function, for example

if (modelQuery.isFetched) {
  <ModelPage model={modelQuery.data} />
} else if (modelQuery.isError) {
  <ErrorPage error={modelQuery.error} />
} else {
  <CircularProgress indeterminate />
}
```

It significantly reduces the amount of boilerplate code for making a request. 

### Updating Data Boilerplate

The default way to update data in React is also with state and effect hooks. 

```ts
const [field, setField] = useState<string>('');

useEffect(() => {
  setField(data.field);
}, [data]);

const onTextChange = event => {
  setField(event.target.value);
};

const onSubmit = async () => {
  const newData = await apiFetch(`/models/${id}`, {
    method: 'PATCH',
    json: {
      field,
    },
  });
  setData(newData);
};
```

Most apps need to keep track of the loading status to disable the submit button to prevent submitting the form multiple times and to render a progress indicator. Most apps need to keep track of the error state to render inline errors if the form data has validation errors from the server. It ends up looking like the same boilerplate for fetching data. 

```ts
const [field, setField] = useState<string>('');
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  setField(data.field);
}, [data]);

const onTextChange = event => {
  setField(event.target.value);
};

const onSubmit = async () => {
  let mounted = true;
  try {
    const newData = await apiFetch(`/models/${id}`, {
      method: 'PATCH',
      json: {
        field,
      },
    });
    if (mounted) {
      setData(newData);
    }
  } catch (e) {
    if (mounted) {
      setError(e);
    }
  } finally {
    if (mounted) {
      setLoading(false);
    }
  }
  return () => {
    mounted = false;
  };
};
```

### React Query Mutating

The problem with `useQuery` is that it only covers fetching data. In most web applications we also need to update data after submitting a form or clicking a button. The `react-query` library provides a `useMutation` hook for wrapping the update or delete method with loading and error state. It also provides a `useQueryClient` hook for invalidating or replacing data. 

```ts
const queryClient = useQueryClient();

const updateMutation = useMutation(() => {
  return apiFetch(`/models/${id}`, {
    method: 'PATCH',
    json: {
      field,
    },
  });
}, {
  onSuccess: newData => {
    queryClient.setQueryData(['model', id], newData);
  },
});
```

If there is a list view for the same type of resource it would also make sense to invalidate those queries to prevent stale data in the interface if the user changes pages. 

```ts
{
  onSuccess: newData => {
    queryClient.setQueryData(['model', id], newData);
    queryClient.invalidateQueries(['models']);
  },
}
```

### Query Keys

The `react-query` library includes a query client that caches and dedupes requests based on query keys. It works kind of like hook deps except the prefix matters for invalidation and objects are compared by value (not by reference). In terms of naming there are a few strategies work. 

1. URL Paths

   If you are fetching a resource at '/users' the query key might be `['users']`. If there are query params in the request it can be included too `['users', query]`. The only downside is the for REST invalidating the collection will invalidate the individual resources too. For example if you invalidate `['users']` it will invalidate `['users', 'aj']`. It could result in making extra requests after updating individual resources depending on the specific code. 

1. Function Name

   Some apps have helper functions or API libraries for fetching data. For example there could be a `searchUsers` method that takes a query and searches all the users. In that case it can make sense to use the function name and arguments as the query key, for example `['searchUsers', query, options]`. The only downside is that if there are different functions for the same resource it could require invalidating all relevant query keys if the data changes. 

1. Resource Type

   The query keys in the documentation for `react-query` look like resource types with additional items that correspond to URL paths or function arguments. In this case the collection is plural and the individual resource is singular, for example `['users', query]` and `['user', 'aj']`. The only downside is that programmers need to be careful to include parent resources in the query key for scoped resources. For example if a team has projects then a query for projects within a team needs to include the team identifier, for example `['projects', teamId, query]`. Otherwise projects for the wrong team would get fetched from the cache with an incorrect query key, for example `['projects', query]`. 
