Something that is not obvious to new software engineers is how to structure and deploy changes. Hackathons and school work are often limited to building a new application from scratch that runs for only 5 minutes. On the job, almost all work is focused on improving an existing application with constant usage.

The most important thing for production software is uptime. If you make a change and it causes the service to degrade or break, that is the worst possible outcome. The goal is **first** to stay up, and **second** to get faster, cheaper, and better over time.

Most companies depend on type checking, linting, automated testing, code review, canary builds, and all sorts of tools designed to prevent careless errors. That is not enough. The other part of keeping the service up is to structure and deploy changes in a series of incremental backwards compatible steps.

### Intermediate States

In the physical world, most changes have a temporary intermediate state, that if continued for too long, would become unacceptable.

**Changing lanes:** If you are driving, the way to change lanes is to cross over the dividing line gradually from one lane to the next. While the change is happening, there is a temporary invalid state. If you were to continue to drive straddling both lanes for a long period of time it would be considered reckless and unsafe.

**Replacing a water pipe:** If you need to replace a water pipe, the way to make the change is to shut off the water in the building, remove the old pipe, install the new pipe, and finally turn the water back on. While the change is happening, there is a temporary invalid state. If the water is not turned back on soon, the residents will get angry.

In software development, it does not work to make changes that include a temporary invalid state. It means the service will degrade or break and it would have been better to not make the change.

So what causes a temporary invalid state?

### Required Fields

You have to be careful adding a required field to an existing data structure. It will pass automated tests, linting, type checking, code review, and still break. It causes a breaking change because there are clients that already exist that do not know about the field, or data records that are alredy stored that do not have the field.

**Request Payload:** If you add a required field to a request payload, existing clients will continue to send requests using the old data structure that does not include the field. The requests will fail validation because the field is required.

**Database Model:** If you add a required field to a data model, existing data records that were stored before the change are now invalid. If you load a data record originally stored before the change and try to update unrelated fields it will fail validation and will not save. 

The fix is to make the field optional. If you prefer, it can be required with a default value for old records. If the correct value will vary for old records and it really should be required, the correct way to make the change is the following steps:

1. Add a new optional field. Start writing the new field for new data records. Deploy the change and confirm it saves for new records.

1. Run a one-time script to backfill old data records. Confirm all records have a value for the field now.

1. Make the field required. Deploy the change.

### Redesigning User Interfaces

You have to be careful changing the layout of the user interface. There are times when you will want to move a setting to a different menu or give the dashboard a complete refresh. The wrong way to make this kind of change is to build and deploy the new version. It will shock and confuse users that were expecting to see the old version. 

For smaller changes, it works well to have both elements in the interface, disable the old element with a message for where to find the new element, and then eventually remove the old element. 

The correct way to make a large interface change such as releasing a new dashboard is as follows. 

1. Keep the old version as the default.

1. Build the new version in private. Include a button on the new version to switch back to the old version.

1. When the new version is ready, add a button on the old version to try out the new version.

1. Talk to users that try the new version and switch back to the old version. What is missing? What is unclear? Improve the new version.

1. Make the new version the default. Keep the link to switch back to the old version. Add a warning on the old version that it will be removed soon. Include a channel to provide feedback.

1. Remove the old version and links to the old version. 

### Changing Data Storage

You have to be careful changing the location where the application stores data. There might be cost savings if you move JSON data out of the primary database into blob storage for example. The correct way to make this change is the following steps:

1. Keep saving JSON data to the old field.

1. Add a new optional field for a file reference.

1. In all of the code that reads the data, check if there is a file reference, if so download the data. For extra safety, only download if there is a feature flag enabled.

1. Run a one-time script to upload a small percent of inline data to storage. Enable the feature flag. Confirm the change does not impact performance for the service.

1. Make a change to upload and store a file reference for new data records. Make the old inline data field optional.

1. Run a one-time script to upload and store the file reference for old records. Confirm that all records have the new file pointer field.

1. Make the new file reference field required.

1. Delete code related to the old field. Drop the old field. Clean up the feature flag.

### Replacing API Routes

You have to be careful changing the location of network calls. When refactoring, it's important to keep in mind existing clients. Even for internal routes, after you deploy there will still be sessions that started during a previous release. This goes for HTTP endpoints, microservices, RPC methods, etc. 

**Replacing Internal Routes:** You can do this for internal routes. If you change the route in place, existing client sessions will break after the server deploys. Follow the steps below.

1. Add the new route. Change the frontend to call the new route. Keep the old route active.

1. Wait for a couple hours or a couple days depending on the length of user sessions.

1. Delete the old route. 

**Replacing External Routes:** You can't really do this. There will always be clients that were developed against older API versions. It has to be a gradual process. It requires following up with customers and serving repeated notices. 

1. Add a new API version. Keep the old version active. 

1. Wait for a long time. Maybe years. Monitor which customers are using the old version. Offer help to migrate and send repeated notices. 

1. Delete the old version. 

### Backwards Compatible Changes

In general, the pattern for making changes to running systems is to keep the old thing running, add the new thing, confirm the new thing is working, carefully switch over to the new thing, wait for a bit, and then finally clean up the old thing.
