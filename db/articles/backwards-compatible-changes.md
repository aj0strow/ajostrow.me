Something that is not obvious to new software engineers is how to structure and deploy changes. Hackathons and school work are often limited to building a new application from scratch that runs for only 5 minutes. On the job, almost all work is focused on improving an existing application with production traffic.

The most important thing for production software is uptime. If you make a change and it causes the service to degrade or break, that is the worst possible outcome. The goal is **first** to stay up, and **second** to get faster, cheaper, and better over time.

There is type checking, linting, automated testing, code review, canary builds, and all sorts of tools designed to prevent careless errors. That is not enough. The other part of keeping the service up is to structure and deploy changes in a series of incremental backwards compatible steps.

### Intermediate States

In the physical world, most changes have a temporary intermediate state, that if continued for too long, would become unacceptable.

**Changing lanes:** If you are driving, the way to change lanes is to cross over the dividing line gradually from one lane to the next. While the change is happening, there is a temporary invalid state. If you were to continue to straddle both of the lanes for a long period of time it would be considered reckless and unsafe.

**Replacing a water pipe:** If you need to replace a water pipe, the way to make the change is to shut off the water in the building, remove the old pipe, install the new pipe, and finally turn the water back on. While the change is happening, there is a temporary invalid state. If the water is not turned back on soon, the residents will get angry.

In software development, it does not work to make changes that include a temporary invalid state. It means the service will degrade or break and it would be better to not make the change.

So what causes a temporary invalid state?

### Required Fields

This rule applies to adding a required field to an existing data structure. It will pass automated tests, linting, type checking, code review, and still take down production. It causes a breaking change because there is existing clients that do not know about the field yet, or existing data records that do not have the field.

**Request Body:** If you add a required field to a request body, existing clients will continue to send requests using the old data structure without the new field and the requests will fail validation.

**Database Model:** If you add a required field to a data model, existing data records in the database are now invalid. If you find and update existing data records it will fail validation and break the application.

The fix is to make the field optional. It can have a default value for old records. If the correct value will vary for old records and it really should be required, the correct way to make the change is the following steps:

1. Add a new optional field. Start writing the new field for new data records. Deploy the change and confirm it saves for new records.

1. Run a one-time script to backfill old data records. Confirm all records have a value for the field now.

1. Make the field required. Deploy the change.

### Major Interface Changes

In software development, there are times when existing dashboards or tools need a complete refresh. The incorrect way to make this kind of change is to build and deploy the new version replacing the old version. It will shock and confuse users that were expecting to see the old version. The correct way to make a large interface change is the following steps:

1. Keep the old version as the default.

1. Build the new version in private. Include a button on the new version to switch back to the old version.

1. When the new version is ready, add a button on the old version to try out the new version.

1. Talk to users that try the new version and switch back to the old version. What is missing? What is unclear? Improve the new version.

1. Make the new version the default. Keep the link to switch back to the old version. Add a warning on the old version that it will be removed soon. Include a channel to provide feedback.

1. Remove the old version and links to the old version.

### Moving Data to Blob Storage

This is pretty common. The data model has a JSON field for example and it starts taking up too much space in the database. The correct way to make this change is the following steps:

1. Keep saving JSON data to the old field.

1. Add a new optional field for a file reference.

1. In all of the code that reads the data, check if there is a file reference, if so download the data. For extra safety, only download if there is a feature flag enabled.

1. Run a one-time script to upload a small percent of inline data to storage. Confirm that it does not impact the performance of the service.

1. Make a change to upload and store only a file reference for new data records. Make the old inline data field optional.

1. Run a one-time script to upload and store the file reference for old records. Confirm that all records have the new file pointer field.

1. Make the new field required.

1. Delete code related to the old field. Drop the old field.

### Replacing API Routes

The first implementation is not always the best. When refactoring, it's important to keep in mind existing clients. Even for internal routes, there can be some overlap when there is old client code making requests to new server code.

**Replacing Internal Routes:** You can do this for internal routes. Keep the old route active, add the new route, change the frontend to call the new route, delete the old route. If you change the route in place, existing client sessions will break after the server deploys.

**Replacing External Routes:** You can't really do this. There will always be clients that were developed against older API versions. It has to be a gradual process that spans entire calendar years. It requires following up with customers and serving lots of repeated notices. In the meantime, the correct way to change the API is to make a new version and direct new customers to the new version.

### Backwards Compatible Changes

In general, the pattern for making changes to running systems is to keep the old thing running, add the new thing, confirm the new thing is working, carefully switch over to the new thing, remove the old thing.
