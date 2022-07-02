Most test suites are painfully slow. There are a few problems with slow tests:

- **Continuous integration costs:** Most professional applications are set up to run all of the tests on every commit. In order to finish the automated testing in a reasonable amount of time, the test files are split into concurrent jobs. More concurrent jobs and longer running tests results in higher computing costs.

- **Coding iterations:** Most software development is iterative. Write code, test if it works, repeat. If running tests is slow, each run pauses the creative process. This is a huge cost to productivity.

- **Test coverage:** Writing tests is writing code. It goes faster to write and run the test cases iteratively. If the tests are slow, at some point engineers will have to prioritize finishing work over writing tests. Without coverage there will be more software bugs in production.

### How Tests Become Slow

Persistent data is the main source of slowness. Software depends on hierarchical and interrelated data. In order to test functionality, there needs to be connected data stores configured with a schema and indexes, records have to be inserted on test setup and deleted on test teardown.

When you are first starting out, the tests will always be fast. Software is fast in isolation. Even the longest integration test with database and service calls finishes in less than a second.

The problem is when you start to grow. If every test case takes 10 milliseconds to 1 second it will add up to seconds and then minutes. It breaks the iterative loop. If every database call takes 10ms then you only get 1,000 database calls before you hit 10 seconds, or 6,000 database calls before you hit 1 minute. It sounds like a lot but it can go quickly.

### Avoid Stubs

The quick solution to skip a code path that requires a lot of setup is to stub the function and reset the function after the test is finished running.

```ts
sinon.stub(importedModule, 'expensiveFunction').returns({ result })
```

There are two problems with stubs:

- There is no longer coverage for the stubbed function. If the behavior for the function changes and it would break the test case the stub hides the failure.

- The stub is tied to the specific module and function. If there is another expensive setup function call added to the code, the engineer that adds it needs to stub that too in your test case. If other engineers need to change the module, function, or return type, they have to refactor your test case. It makes the code less maleable.

### Analogy: Dynamic Programming

In dynamic programming, after breaking down the problem into recursive sub-problems, the goal is to identify the common sub-problems and only perform them once to speed up the solution. The same concept applies to automated testing.

In most applications, you have to sign up to start using the service. If we are building a todo app, the application logic might look something like this:

Sign Up:

- Check if row exists in User table.
- Insert row in User table.

Sign In:

- Find row in User table.
- Sign access token.

Create Todo:

- Find row in User table.
- Insert row in Todo table.

Mark Complete:

- Find row in User table.
- Find row in Todo table.
- Update row in Todo table.

Mark Incomplete:

- Find row in User table.
- Find row in Todo table.
- Update row in Todo table.

Show Pending:

- Find row in User table.
- Query cursor of rows in Todo table.

If you look at the behavior, there is already some overlap.

- _Sign In_, _Create Todo_, _Mark Complete_, _Mark Incomplete_, _Show Pending_ require sign up. _Sign Up_ requires 2 database calls which means 10 duplicate database calls.
- _Create Todo_, _Mark Complete_, _Mark Incomplete_, _Show Pending_ require sign in. _Sign In_ requires 1 database call which means 4 duplicate database calls.
- _Mark Complete_, _Mark Incomplete_, _Show Pending_ require creating a todo. _Create Todo_ requires 2 database calls for 6 duplicate database calls.
- _Sign Up_, _Sign In_, _Create Todo_, _Mark Complete_, _Mark Incomplete_, _Show Pending_ require clearing the User table during teardown. It requires 6 database calls.
- _Create Todo_, _Mark Complete_, _Mark Incomplete_, _Show Pending_ require clearing the Todo table during teardown. It requires 4 database calls.

Similar to dynamic programming, the benefit of eliminating duplicate sub-problems becomes more clear as your input size increases. With a larger application and more tests, there is more and more overlap.

### Cheap vs Expensive

In the example above, for every database call we are testing the correctness of the database driver, ORM library, and database schema. In order to make the tests correct, we need to make sure the database calls have test coverage too, but once we have tested a database call, every additional call in the test suite is duplicate testing.

We have already talked about how database calls are the most common reason for slow tests. We have also discussed the drawbacks of stubs. In order to make the tests fast, we need to reduce the number of database calls, but still test each database call at least once.

Ther answer is to have two different implementations for persistent data. There is a production implementation which is expensive that calls the database. There is a cheap implementation for testing that holds data in memory. In the user auth flow, if we make calls to the cheap implementation, we don't need to make database calls.

It would solve our problem but there are unresolved questions.

- How do you make sure the auth flow has the cheap implementation in testing and the production implementation in production?
- How do you know the auth flow will work in production if we have been testing with the cheap implemetation.

The answer to both of these questions is to build the application with interfaces. In this example we are going to get rid of the duplicate _Sign Up_, _Sign In_, and clearing the User table for every test case.

### Build Interfaces

The exact interfaces will depend on the application. It works well to have software interfaces based on high level functional areas. There could be `UserAuth` and `Billing` for example. You can think of software interfaces as microservices that run on the same machine. If you already have microservices the service boundary is the interface.

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
    // snip
    this.users.push({ email, passwordDigest })
    // snip
  }

  // snip
}
```

Set the interface that is appropriate.

```ts
if (process.env.NODE_ENV === 'test') {
  app.set('UserAuth', new TestUserAuth())
} else {
  app.set('UserAuth', new ProdUserAuth())
}
```

### Test Interfaces

The next step is to write tests to confirm the production implementation is working. You should test the interface to make sure the behavior is correct. It could be the fields of the response, errors that should be thrown, sequences of calls. Whatever is needed to confirm that it works.

- Sign up with login info. Confirm it works.
- Sign up again with the same login info. Confirm it throws an email conflict error.
- Sign in with login info. Confirm it works.
- Sign in with incorrect login info. Confirm it throws an invalid login error.
- Etc, etc

When you are writing tests, only test the service boundary. There is no need to query the User table after _Sign Up_ for example. Instead make a call to _Sign In_ to confirm if all fields were saved correctly.

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

### Code With Interfaces

Now that we have a `UserAuth` service with two implementations, the last step is to rewrite the routes.

Sign Up:

- Sign up with `UserAuth`.

Sign In:

- Sign in with `UserAuth`.

Create Todo:

- Load session with `UserAuth`.
- Insert row in Todo table.

Mark Complete:

- Load session with `UserAuth`.
- Find row in Todo table.
- Update row in Todo table.

Mark Incomplete:

- Load session with `UserAuth`.
- Find row in Todo table.
- Update row in Todo table.

Show Pending:

- Load session with `UserAuth`.
- Query cursor of rows in Todo table.

In our testing, all of the `UserAuth` steps on the cheap implementation should take microseconds.

### More Interfaces

There is no limit to the number of interfaces and nesting of interfaces. In order to reduce the duplication of finding or updating a row in the Todo table there could be a `TodoRepository` interface with a cheap implementation.

At some point, however, there is diminishing returns. It often makes sense to start with direct database calls and refactor into a service interface once there is too much duplication. What is great about this technique is that you can start refactoring code into interfaces at any time and get incremental benefits. The drawback is that it requires more coding to maintain two implementations for each service.
