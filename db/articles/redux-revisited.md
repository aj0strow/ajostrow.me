I wrote [Typed Redux](/articles/typed-redux) after using TypeScript with Redux for the first time. It was a mistake writing the article so soon after learning both technologies. Here is my updated approach. 

### Store Module

It's nice to keep your store code in one directory tree. The structure I use:

```
store
├── actions.ts
├── index.ts
├── reducers.ts
└── users
    ├── actions.ts
    ├── events.ts
    ├── index.ts
    ├── reducers.ts
    └── selectors.ts
```

In the directory tree above, `users` is a resource directory. 

### Connected Containers

Before diving into designing the store, it's helpful to see how the store is used. For example, to wire up the `UserIndex` page of an imaginary website. 

```ts
// route/UserIndex/index.tsx


// Step 1: define connected props

import { User } from "models/user"

interface StoreProps {
    users: User[];
}

// Step 2: use selectors to map the needed props

import { ReduxState } from "store"
import { getRoute } from "store/route"
import { getUsersByAccount } from "store/users"

function mapState(state: ReduxState): StoreProps {
    const route = getRoute(state)
    const accountId = route.params["account"]
    const usersByAccount = getUsersByAccount(state)
    return {
        users: usersByAccount[accountId],
    }
}

// Step 3: connect the props and needed actions

import { connect } from "react-redux"
import { inviteUser } from "store/users"

const enhance = connect(mapState, {
    inviteUser,
})

// Step 4: export the new connected component

import UserIndex from "./UserIndex"

export default enhance(UserIndex)
```

You can see each resource directory needs to export *selectors* that start with `get` and action verbs. The main store module needs to export an interface defining the complete app state. 

### Domain Model

You need to define what goes in the store. The business goals of the project should define the domain models. For example a financial app could have `Trade` and `Quote` while a communication platform may include `Person` and `Discussion`. 

```ts
// models/user.ts

export interface User {
    id: string;
    name: string;
}
```

I always need a lookup collection as well.

```ts
// models/lookup.ts

export type Lookup<T> = Record<string, T>
```

### Reducer Shape

The first step is to define your reducers and selectors. 

```ts
// store/users/reducers.ts

import { User } from "models/user"
import { Lookup } from "models/lookup"

export type Users = Lookup<User>
  
// To be continued ...
```

Include the new reducer state in the main app state.

```ts
// store/reducers.ts

import { Users } from "store/users/reducers"

export interface ReduxState {
    users: Users;
}
```

Import back into the users resource directory to have type-safe selection. 

```ts
// store/users/selectors.ts

import { ReduxState } from "store/reducers"
import { Users } from "store/users/reducers"

export function getUsers(state: ReduxState): Users {
    return state.users
}
```

Test the TypeScript compiler by changing the keys or introducing a typo. You should be confident the reducer shape is reflected in the app state. 

### Action Events

Instead of action type constants, TypeScript offers [discriminated unions](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types). By providing different `type` string constants in interface definitions, we can use type-safe guard conditions. 

```ts
// store/users/events.ts

import { User } from "models/user"

export interface UserSnapshot {
    type: "UserSnapshot";
    payload: {
        user: User;
    };
}
```

Combine every action event into one combined union type.

```ts
// store/events.ts

import { UserSnapshot } from "store/users/events"

export type ReduxAction = UserSnapshot | ...
```

Import the action union type into the reducer and access the payload properties safely. 

```ts
// store/users/reducers.ts

...

// To be continued ...

import { ReduxAction } from "store/events"

export function users(state = {}, action: ReduxAction): Users {
    if (action.type == "UserSnapshot") {
        const { user } = action.payload
        return {
            ...state,
            [user.id]: user,
        }
    }
    return state
}
```

Test the TypeScript compiler by removing `UserSnapshot` from the union type. Add it back and try accessing a property on the action payload that doesn't exist, or exists for a different action. 

### Action Thunks

You can dispatch synchronous actions by returning a `ReduxAction`. 

```ts
// store/users/actions.ts

import { User } from "models/user"

export function setUserSnapshot(user: User): ReduxAction {
    return {
        type: "UserSnapshot",
        payload: {
            user,
        },
    }
}
```

Most apps use async action creators. I use the `redux-thunk` middleware, it's simple and works. 

```ts
// store/events.ts

export interface ReduxDispatch {
    (action: ReduxAction): void;
}

export interface ReduxThunk {
    (dispatch: ReduxDispatch): void;
}
```

```ts
// store/users/actions.ts

import { ReduxThunk, ReduxDispatch } from "store/events"

export function searchUserByName(name: string): ReduxThunk {
    return function(dispatch: ReduxDispatch): void {
        fetch(`/api/users/${name}`)
        .then(response => response.json())
        .then(data => {
            const user: User = {
                id: data.id,
                name: data.name,
            }
            return user
        })
        .then(user => {
            dispatch(setUserSnapshot(user))
        })
        .catch(err => {
            console.error(err)
        })
    }
}
```

### Redux Resource

Each resource gets its own directory within the store. 

```
store
├── users
│   ├── actions.ts
│   ├── events.ts
│   ├── index.ts
│   ├── reducers.ts
│   └── selectors.ts
```

You should export the actions and selectors in the index. 

```ts
// store/users/index.ts

export {
    searchUserByName,
} from "./actions"

export {
    getUsers,
} from "./selectors"
```

Refer back to the Connected Containers section. We have gone full circle.

### Store Instance

The final step is to combine each resource reducer into the app reducer. 

```ts
import { combineReducers } from "redux"
import { users } from "store/users/reducers"

const reducer = combineReducers({
    users,
})

import { createStore, applyMiddleware } from "redux"
import thunk from "redux-thunk"

export const store = createStore(reducer, applyMiddleware(thunk))

export { ReduxState } from "store/reducers"
```

In the main entry point, wrap your root component or router in the redux store provider component. 

```ts
// main.tsx

import { Provider } from "react-redux"
import { store } from "store"
import { checkAuthState } from "store/session"

function main() {
    store.dispatch(checkAuthState())
    
    const app = <Provider store={store}>
        <Router />
    </Provider>
    
    ReactDOM.render(app, document.getElementById("view"))
}
```

### Final Remarks

It's a tedious but effective way to make sure your app data is always in the right place and up-to-date. Some final tips:

* Add a new resource whenever you need data. If you need to track requests in flight or router params, add a new resource. 
* Shape your reducers to make selectors fast. If you need to select by multiple parameters, add a new reducer for each one, such as `usersById` and `usersByName`. 
* Manage complexity in your action creators, not in your reducers. It's better to dispatch more actions than to reduce more action types. For example dispatch collections one-by-one. 
* Don't use arrays in reducers. Use `reselect` to sort and memoize in your container state mapping function. 

If you have comments, tweet them. Thanks for reading.  
