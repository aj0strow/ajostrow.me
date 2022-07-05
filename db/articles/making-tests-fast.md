Most test suites are painfully slow. There are a few problems with slow tests:

- **Continuous integration costs:** Most professional applications are set up to run all of the tests on every commit. In order to finish the testing in a reasonable amount of time, the test cases are split into concurrent jobs. Even so, more concurrent jobs means more server time spent on running tests, which increases costs.

- **Coding iterations:** Software development is iterative. Write code, test if it works, repeat. Waiting for tests to run pauses the creative process. This is a huge cost to productivity.

- **Test coverage:** Writing tests is writing code. It goes faster to write and run the test cases iteratively. If the tests are slow, at some point engineers will have to prioritize finishing work over writing tests. Without high test coverage more errors will make it into production.

### How Tests Become Slow

The main source of slowness is persistent data. Software applications read and write hierarchical and interrelated data. In order to test functionality, there needs to be connected data stores configured with a schema and indexes, records have to be inserted on test setup, modified during test cases, and deleted on test teardown.

While the application is small, the tests will always be fast. Even the longest integration test with database and service calls will finish in a matter of seconds. The problem is when the application starts to grow. If every database call takes 10ms then you only get 1,000 database calls before you hit 10 seconds, or 6,000 database calls before you hit 1 minute. It sounds like a lot but it can go quickly.

The way that applications are structured, newer code depends on older code. In order to test newer code, related records and preconditions need to be set up and cleared. The hierarchy can get deep. There might be dozens of preconditions for each test case.

### Avoid Stubs

The quick solution to skip a code path that requires a lot of setup is to stub out functions in the call stack. In the teardown the functions can be reset.

```ts
sinon.stub(importedModule, 'expensiveFunction').returns({ result })
```

There are two problems with stubs:

- There is no longer coverage for the stubbed function. If the behavior for the function changes and it would break the test case the stub hides the failure.

- The stub is tied to the specific module and function. If other engineers need to change the module, function, or return type, they have to refactor your test case. It makes the code less maleable.

### Analogy: Dynamic Programming

In dynamic programming, after breaking down a problem into recursive sub-problems, the time complexity is often exponential due to repeated sub-problems. The next step is to memoize to compute each sub-problem exactly once. If done correctly, the solution becomes fast. The same concept applies to automated testing.

In most applications, you have to sign up to start using the service. If we are building a todo app, the application logic might look something like this:

> Sign Up
>
> - Check if row exists in User table.
> - Insert row in User table.
>
> Sign In
>
> - Find row in User table.
> - Sign access token.
>
> Create Todo
>
> - Find row in User table.
> - Insert row in Todo table.
>
> Mark Complete
>
> - Find row in User table.
> - Find row in Todo table.
> - Update row in Todo table.
>
> Mark Incomplete
>
> - Find row in User table.
> - Find row in Todo table.
> - Update row in Todo table.
>
> Show Pending
>
> - Find row in User table.
> - Query cursor of rows in Todo table.

If you look at the behavior, there is already some overlap.

- _Sign In_, _Create Todo_, _Mark Complete_, _Mark Incomplete_, _Show Pending_: each require sign up. _Sign Up_ requires 2 database calls which means 10 duplicate database calls.
- _Create Todo_, _Mark Complete_, _Mark Incomplete_, _Show Pending_: each require sign in. _Sign In_ requires 1 database call which means 4 duplicate database calls.
- _Mark Complete_, _Mark Incomplete_, _Show Pending_: each require creating a todo. _Create Todo_ requires 2 database calls for 6 duplicate database calls.
- _Sign Up_, _Sign In_, _Create Todo_, _Mark Complete_, _Mark Incomplete_, _Show Pending_: each require clearing the User table during teardown. It requires 6 database calls.
- _Create Todo_, _Mark Complete_, _Mark Incomplete_, _Show Pending_: each require clearing the Todo table during teardown. It requires 4 database calls.

Similar to dynamic programming, the benefit of eliminating duplicate sub-problems becomes more clear as your input size increases. With a larger application and more tests, there is more and more overlap.

### Test vs Production

In the example above, for every database call we are testing the correctness of the database driver, ORM library, and database schema. In order to make the tests correct, we need to make sure the database calls have test coverage too, but once we have tested a database call, every additional call in the test suite is duplicate testing.

We have already talked about how persistent data is most common reason for slow tests. We have also discussed the drawbacks of stubs. In order to make the tests fast, we need to reduce the number of database calls, but still test each database call at least once.

The answer is to have two different implementations for persistent data. There has to be a production implementation which is expensive and calls the database. In addition we can have a test implementation that holds data in memory. If we use the test implementation, we don't need to make database calls.

It would solve our problem but there are unresolved questions.

- How do you make sure the auth flow has the test implementation while testing, but has the production implementation in production?
- How do you know the auth flow will actually work in production if we have been testing with the test implemetation?

The answer to both of these questions is to build the application with interfaces. In this example we are going to get rid of the duplicate _Sign Up_, _Sign In_, and clearing the User table for every test case.

### Build Interfaces

The exact interfaces will depend on the application. It works well to have software interfaces based on high level functional areas. There could be `UserAuth` and `Billing` for example. You can think of software interfaces as microservices that run on the same machine.

> Note: If you already have microservices, the service boundary is the interface.

Define the interface.

```ts
interface UserAuth {
  signUp(req: SignUpRequest): Promise<SignUpResponse>
  signIn(req: SignInRequest): Promise<SignInResponse>
  loadSession(req: LoadSessionRequest): Promise<LoadSessionResponse>
}
```

Implement the interface for production.

```ts
class ProdUserAuth implements UserAuth {
  async signUp(req: SignUpRequest): Promise<SignUpResponse> {
    const exists = await db.table('users').exists({ email: req.email })
    const passwordDigest = await bcrypt.encrypt(req.password)
    // snip
    await db.table('users').insert({ email, passwordDigest })
    // snip
  }

  // snip
}
```

Implement the interface for testing.

```ts
class TestUserAuth implements UserAuth {
  private users = []

  async signUp(req: SignUpRequest): Promise<SignUpResponse> {
    const exists = this.users.some((user) => user.email == req.email)
    const passwordDigest = btoa(req.password)
    // snip
    this.users.push({ email, passwordDigest })
    // snip
  }

  // snip
}
```

Set the implementation that is appropriate for the environment. It's easier to reference the interfaces from a single registry or config object instead of passing in interfaces throughout the application.

```ts
if (process.env.NODE_ENV === 'test') {
  app.set('UserAuth', new TestUserAuth())
} else {
  app.set('UserAuth', new ProdUserAuth())
}
```

### Test Interfaces

The next step is to write tests to confirm the production implementation is working. You should test the interface to make sure the behavior is correct. It could be the fields of the response, errors that should be thrown, sequences of calls. Whatever is needed to confirm that it works.

> Example test cases:
>
> - Sign up with login info. Confirm it works.
> - Sign up again with the same login info. Confirm it throws an email conflict error.
> - Sign in with login info. Confirm it works.
> - Sign in with incorrect login info. Confirm it throws an invalid login error.
> - Etc, etc

When you are writing tests, only test the service boundary. In the auth example, there is no need to query the User table after _Sign Up_ for example. Instead make a call to _Sign In_ to confirm if all fields were saved correctly.

```ts
describe('UserAuth', function () {
  const userAuth = new ProdUserAuth()

  it('allows sign in after sign up', async function () {
    const login = { email: 'user@example.com', password: 'a9sd87f$a@8df7' }
    const signUpResponse = await userAuth.signUp(login)
    assert.isString(signUpResponse.user.id)
    assert.equal(signUpResponse.user.email, login.email)
    const signInResponse = await userAuth.signIn(login)
    assert.equal(signInResponse.user.id, signUpResponse.user.id)
    assert.equal(signInResponse.user.emailConfirmed, false)
    // snip
  })
})
```

Now that you have a test suite to confirm if the interface is working, test the cheap implementation too. If the cheap implementation passes the tests, it can be used as a substitute.

```ts
describe('UserAuth', function () {
  describe('ProdUserAuth', function () {
    testUserAuth(new ProdUserAuth())
  })

  describe('TestUserAuth', function () {
    testUserAuth(new TestUserAuth())
  })
})

function testUserAuth(userAuth: UserAuth): void {
  it('allows sign in after sign up', async function () {
    // snip
  })

  // snip
}
```

### Write Code Using Interfaces

Now that we have a `UserAuth` service with two implementations, the last step is to rewrite the routes.

> Sign Up
>
> - Sign up with `UserAuth`.
>
> Sign In
>
> - Sign in with `UserAuth`.
>
> Create Todo
>
> - Load session with `UserAuth`.
> - Insert row in Todo table.
>
> Mark Complete
>
> - Load session with `UserAuth`.
> - Find row in Todo table.
> - Update row in Todo table.
>
> Mark Incomplete
>
> - Load session with `UserAuth`.
> - Find row in Todo table.
> - Update row in Todo table.
>
> Show Pending
>
> - Load session with `UserAuth`.
> - Query cursor of rows in Todo table.

In our testing, all of the `UserAuth` steps on the cheap implementation should take microseconds.

### Split Out More Interfaces

There is no limit to the number of interfaces and nesting of interfaces. In order to reduce the duplication of finding or updating a row in the Todo table there could be a `TodoRepository` interface with a cheap implementation.

At some point, however, there is diminishing returns. It often makes sense to start with direct database calls and refactor into a service interface once there is too much duplication. What is great about this technique is that you can start refactoring code into interfaces at any time and get incremental benefits. The drawback is that it requires more coding to maintain two implementations for each software service.
