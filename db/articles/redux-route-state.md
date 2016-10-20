When using React and Redux for application state and rendering, it's elegant to keep track of current route params for use with memoized selectors.

### Example Structure

Redux works best with denormalized data. 

```js
// example store data

{
  route: {
    params: {
      accountName: "ajostrow",
      projectId: "4",
    }
  },
  accounts: {
    "ajostrow": {
      id: "1",
      name: "ajostrow",
    }
  },
  projects: {
    "123": {
      id: "123",
      account: "1",
      title: "Cool Project",
    }
  },
}
```

Imagine a dashboard with route `/accounts/:accountName/projects/:projectId`. You could fetch the current account and project using memoized selectors.

```js
// scenes/dashboard/selectors.js

import { createSelector } from "reselect"

const getRouteParams = (state) => state.route.params
const getAccounts = (state) => state.accounts
const getProjects = (state) => state.projects

export const getCurrentAccount = createSelector([
  getAccounts,
  getRouteParams,
], (accounts, params) => accounts[params.accountName])

export const getCurrentProjects = createSelector([
  getProjects,
  getCurrentAccount,
], (projects, account) => {
  return pick(projects, project => project.account == account.id)
})

export const getCurrentProject = createSelector([
  getRouteParams,
  getCurrentProjects,
], (params, projects) => projects[params.projectId])
```

Throughout the dashboard, connect with the current values.

```js
// scenes/dashboard/layout/index.js

import { createStructuredSelector } from "reselect"
import { getCurrentAccount, getCurrentProject } from "../selectors"

const mapState = createStructuredSelector({
  account: getCurrentAccount,
  project: getCurrentProject,
})
@connect(mapState)
class DashboardLayout extends Component
```

### Route Changes

The first issue is `redux` and `react-router` don't know about each other. There are a few github projects aimed at integrating the two. I found both to be clumsy and over the top for saving route state to the store. 

* [react-router-redux](https://github.com/reactjs/react-router-redux)
* [redux-router](https://github.com/acdlite/redux-router)

You can't just hook into the history object, because it doesn't parse route params.

```js
const unbind = history.listen(() => {
  // doesn`t work, no params
})
```

You also can't grab the params out of the router itself.

```js
let router;
const onUpdate = () => {
  // doesn`t work, router object not helpful
}
router = <Router onUpdate={onUpdate}>
  { routes }
</Router>
```

Instead the solution is to wrap the entire application in a generic parent route that passes children.

```js
// components/routestate/index.js

import { PropTypes } from "react"
import { compose, setPropTypes, lifecycle } from "recompose"
import { connect } from "react-redux"
import { changeRouteState } from "store/route"

// Combine higher order components.
const enhance = compose(

  // Bind actions to redux store.
  connect(null, { changeRouteState }),
  
  // Set propTypes on component class.
  setPropTypes({
    changeRouteState: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
  }),
  
  // Listen for prop changes (route changes) and send action.
  
  lifecycle({
    componentWillMount() {
      this.componentWillReceiveProps(this.props)
    },
    componentWillReceiveProps({ changeRouteState, location, params }) {
      changeRouteState({ location, params })
    },
  })
)

const RouteState = ({ children }) => {
  return children
}

export default enhance(RouteState)
```

Insert it at the top of the router hierarchy.

```js
<Router>
  <Route component={RouteState}>
    { routes }
  </Route>
</Router>
```

### Route State

The last step is to store the route params on each change event.

```js
// store/route.js

export const ROUTE_CHANGE = 'ROUTE_CHANGE'

export const changeRouteState = ({ location, params = {} }) => {
  return {
    type: ROUTE_CHANGE,
    payload: {
      location,
      params
    }
  }
}

export default function(state = {}, action) {
  swich(action.type) {
  case ROUTE_CHANGE:
    const { location, params } = action.payload
    return {
      key: location.key,
      pathname: location.pathname,
      params,
      query: location.query,
      search: location.search,
      hash: location.hash,
      state: location.state,
    }
  default:
    return state
  }
}
```

Other reducers can listen for route changes to clean up transient state. 

```js
// store/resource.js

  case ROUTE_CHANGE:
    return cleanUpRequests(state)
```
In summary, instead of integrating a large framework for syncing route state it's just as easy to add an extra top level route. 
