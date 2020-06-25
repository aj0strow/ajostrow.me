Every web application uses data. When you are designing the schema for storing data, or the interface for transmitting data, a good rule of thumb is to stick to lists of objects.

### List of Strings Anti-Pattern

If the data that you need to store is a list of values, then it should be a list of objects. For example, imagine that you need to store one or multiple emails for a user profile. The quickest way is to add a list of strings. 

```ts
interface User {
  emails: string[]; // mistake
}
```

Fast forward a couple months, and the company needs to verify emails because there are lots of typos and fake emails. You can't add a `verified` boolean field to a string value, so now you have to add a new field to the user object to represent the verification status. 

It could be another list of `boolean` values that must be kept in the same order and length as the array of emails, but that is error prone. It is possible that one of the emails will be moved or re-arranged and then our database will have the wrong verification status.

```ts
interface User {
  emails: string[];
  emailVerified: boolean[]; // error prone
}
```

It would make more sense to use a dictionary. There is less chance of data corruption, but there are still drawbacks. The data structure is not self-describing which makes it harder for new developers to learn how the application works. It is more difficult to modify or delete information because multiple fields need to be changed. In the worst case that could lead to a data compliance incident. 

```ts
interface User {
  emails: string[];
  emailVerified: Record<string, boolean>; // added complexity
}
```

What happens if you want to store the last time the user signed in with a particular email? I guess that is another dictionary. 

```ts
interface User {
  emails: string[];
  emailVerified: Record<string, boolean>;
  lastEmailSignIn: Record<string, Date>;
}
```

What about storing the original email for display purposes, and normalizing the email for maintaining a unique index? Another dictionary. 

```ts
interface User {
  emails: string[];
  emailVerified: Record<string, boolean>;
  lastEmailSignIn: Record<string, Date>;
  originalEmails: Record<string, string>;
}
```

It quickly gets out of hand. If only we could go back in time and use a list of objects. 

```ts
interface User {
  emails: Email[];
}

interface Email {
  address: string;
}
```

After all of our changes it looks like this:

```ts
interface User {
  emails: Email[];
}

interface Email {
  address: string; // normalized address
  verified: boolean;
  lastSignIn: Date;
  originalAddress: string;
}
```

It is much easier to understand and reason about. 

### Dictionary of Numbers Anti-Pattern

It is the same problem with mapping to a string or number. Imagine you are building a research sharing application and you want to allow scientists to sync lists of papers with each other. 

```ts
interface ResearchPaper {
  id: string;
  url: string;
  contentType: string;
  contentLength: number;
}
```

There are a lot of papers out there, and more are published all the time, so it will be faster to sync batches of papers at a time. It would be quick and easy to provide a standard HTTP status as the response for each record in the batch. 

```ts
interface SyncRequest {
  papers: ResearchPaper[];
}

interface SyncResponse {
  results: Record<string, number>; // id => HTTP status
}
```

It works, but it does not allow adding new fields per result. You can imagine a request to add a helpful error message if there is a problem downloading the paper. It is possible to add a new dictionary for every new field, but that gets out of hand like in the emails example. It is better to start off with a dictionary mapping to objects. 

```ts
interface SyncResponse {
  results: Record<string, ResearchPaperSyncResult>;
}

interface ResearchPaperSyncResult {
  status: number;
}
```

### Only for Data Schemas

Lists of objects is only the rule for data schemas. It would not make sense to wrap strings and numbers in objects in application code because you can easily change the type. It is really for data storage or public interfaces where there is a cost to changing the type in the future. 
