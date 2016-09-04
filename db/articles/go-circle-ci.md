[CircleCI](https://circleci.com/) is great for running tests on every git commit. It integrates with GitHub, and marks each commit with either a &#x2713; or &#x2717; to indicate if the tests passed. It's not configured for `go` out of the box, but with a little scripting it works. 

### About CI

Continuous Integration (CI) is used for Continuous Deployment (CD). Each time you push to the git master branch, if the tests pass, that commit is pushed live to production. 

When you want to add a new feature, checkout a new branch, push commits, and then open a pull request. Hosting providers like Heroku allow *review apps* which are separate app deployments automatically created on each pull request and given a unique subdomain. If you merge the new feature or bug fix into the master branch, tests run, and it is automatically deployed. 

The benefits of CI/CD is two-fold. First, you always have the latest version deployed. Second, you need excellent test coverage because automated tests are the only gate before pushing live. 

### Cloud Services

There are a number of cloud services that offer CI/CD. Here are the ones I know about that have low cost or free plans. 

* GitLab
* Drone
* Codeship
* Circle
* Travis
* Jenkins

I chose Circle for the configuration flexibility and excellent experience. It makes a difference having the build status in the favicon, the commands piped via websocket in realtime, and the result synced to GitHub.

### Ubuntu Trusty

The first step is to check you have the right `go` version. I use `go1.6.2` which comes with the ubuntu trusty image on Circle. You can change the machine image in the settings for the project. New projects should default to trusty. 

If you need a specific `go` version, you can download and install go in the `machine.pre` section of the `circle.yml` config.

### Circle Config

Speaking of which, `circle.yml` lets you configure the entire process. Here's the minimal `go` config to get the tests running and (hopefully) passing. I use `govendor` for package management, so you may need to change those lines depending on your project. 

```yml
# circle.yml

machine:
  environment:
    GOPATH: /home/ubuntu/go
    PATH: '/usr/local/go/bin:/home/ubuntu/go/bin:$PATH'
    ROOTPATH: /home/ubuntu/go/src/{source-code-path}

checkout:
  post:
    - mkdir -p $ROOTPATH
    - cp -r "/home/ubuntu/$(basename $ROOTPATH)" $(dirname $ROOTPATH)

dependencies:
  pre: 
    - go get github.com/kardianos/govendor
  
  override:
    - cd $ROOTPATH && govendor sync

test:
  override:
    - cd $ROOTPATH && govendor test +local
```

I chose to put the entire `go` file structure into `/home/ubuntu/go`. It needs to be somewhere we have privileges, and the `/home/ubuntu` is the home directory.

```txt
GOPATH: /home/ubuntu/go
```

I want to use command line tools installed with `go get` so I added the go binary command and the go bin folder to the system path. 

```txt
PATH: '/usr/local/go/bin:/home/ubuntu/go/bin:$PATH'
```

I haven't found a way to change the working directory, so instead I set `ROOTPATH` to the project folder and change into it for each go-related command. In the checkout step, I copy the source code from the default folder to where the go command expects it to be. 

```txt
ROOTPATH: /home/ubuntu/go/src/namespace/project

- mkdir -p $ROOTPATH
- cp -r "/home/ubuntu/project" $(dirname $ROOTPATH)

- cd $ROOTPATH && {run-command}
```

You need to replace `{source-code-path}` with the path to your code, often `github.com/{org}/{repo}`. Circle automatically fetches the git repository into `/home/ubuntu/{project}`. You can verify all this by adding commands to see what's going on. 

```yml
checkout:
  pre:
    - echo $PWD
    - ls
    - ls /home/ubuntu
```

### Test Results

Circle parses jUnit XML files which give more information about which tests passed or failed, and how long each test took. To enable granular results, pipe the `go test` output into the correct format.

```yml
# circle.yml

# Add dependency for reporting.

dependencies:
  pre:
    - go get github.com/jstemmer/go-junit-report
    
# Pipe output to the special reports folder.

test:
  pre:
    - mkdir -p $CIRCLE_TEST_REPORTS/go
  override:
    - cd $ROOTPATH && govendor test +local -v | go-junit-report > $CIRCLE_TEST_REPORTS/go/junit.xml
```

After the tests fun, Circle checks the reports folder to see if we left any jUnit XML files. The folder `go` is an arbitrary name. If you had multiple languages or tests to run, you would use a different folder name per environment. 

```
/$CIRCLE_TEST_REPORTS
  /go
    /junit.xml
  /phantomjs
    /junit.xml
``` 

The test command itself uses both the `govendor` flag `+local` and the `go` flag `-v`. The `govendor` command uses flags starting with `+` and passes flags starting with `-` so the command expands to:

```sh
govendor +local
  go test -v {package 1}
  go test -v {package 2}
  ...
```

The `go` reporter command line program `go-junit-report` reads from *stdin* and writes to *stdout* which means I can pipe the test output through the reporter to the output file.

```sh
{test-command} | go-junit-report > {output-file}
```

Instead of `go` test output:

```txt
=== RUN   TestSignAndParse
--- PASS: TestSignAndParse (0.00s)
PASS
ok  	namespace/project/jwt	0.016s
```

We get machine output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
	<testsuite tests="1" failures="0" time="0.023" name="bridgerock/s1/jwt">
		<properties>
			<property name="go.version" value="go1.6.2"></property>
		</properties>
		<testcase classname="jwt" name="TestSignAndParse" time="0.000"></testcase>
	</testsuite>
</testsuites>
```

Circle will save the results and report which tests took the longest right in the web dashboard. 

### Database Setup

Circle comes with databases already installed. Keep in mind if you pipe output to the reporter, every other command needs to write to stderr with `1>&2`.

```sh
# bin/test

# Choose database name.
db=testing

# Set needed env vars.
export ENVIRONMENT=test
export DATABASE_URL="postgres://localhost/$db?sslmode=disable"

# Create a new database.
psql -d postgres -c "CREATE DATABASE $db WITH ENCODING 'UTF8';" 1>&2

# Run all migrations.
bin/migrate up 1>&2

# Pass command line args to test command.
govendor test +local "$@"

# Capture the test result.
code=$?

# Drop the database.
psql -d postgres -c "DROP DATABASE $db;" 1>&2

# Exit with the test result. 
exit $code
```

Call the test command just like the `go` command and it will setup and teardown the database, and include all local packages.

```sh
bin/test -v
```

In the `circle.yml` the new test override command would be:

```sh
cd $ROOTPATH && bin/test -v | go-junit-report > $CIRCLE_TEST_REPORTS/go/junit.xml
```

Thanks for reading!

**[@aj0strow](https://twitter.com/aj0strow)**
