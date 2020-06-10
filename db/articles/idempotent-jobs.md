In many applications there are flaky workflows. For example, if you are building a chat application and you want to allow users to search uploaded documents, you might have a workflow with multiple steps: 

1. It is a premium feature. Check if the customer is paying. 
2. Run OCR on the document to get raw text.
3. Update the search index for the chat application channel. 

The first implementation might look like this:

```ts
async function addAttachmentToSearchIndex(channel: Channel, attachment: Attachment): Promise<void> {
  const customer = await Customer.find(channel.customerId);
  if (!customer.premium) {
    return;
  }
  const ocrData = await runOCR(attachment);
  await updateSearchIndex({
    channelId: channel.id,
    attachmentId: attachment.id,
    text: ocrData.text,
  });
}
```

The problem is the code will sometimes fail. Here are specific examples:

- Internet cuts out during the function call
- Server where the job is running stops or dies
- OCR service is temporarily down
- Search index service is temporarily down

This kind of work is often configured to run in a background job (or step function) to allow retrying after errors. If the function will potentially be called multiple times, every unit of work should be [idempotent](https://stackoverflow.com/questions/1077412/what-is-an-idempotent-operation). 

Here are ways it can run multiple times:

- Background job hits a temporary error and runs again
- Developer runs a backfill script to index lots of documents

Here is how to make the function safe to retry:

```ts
async function addAttachmentToSearchIndex(channel: Channel, attachment: Attachment): Promise<void> {
  // Premium feature.
  const customer = await Customer.find(channel.customerId);
  if (!customer.premium) {
    return;
  }

  // Check for existing OCR data.
  if (!attachment.ocrData) {
    // If not, run OCR and save the OCR data.
    attachment.ocrData = await runOCR(attachment);
    await attachment.save();
    logger.info(`updated OCR for attachment ${attachment.id}`);
  }

  // Check for existing search index status.
  if (!attachment.searchIndexStatus) {
    // If not, update the search index. 
    attachment.searchIndexStatus = await updateSearchIndex({
      channelId: channel.id,
      attachmentId: attachment.id,
      text: ocrData.text,
    });
    await attachment.save()
    logger.info(`added attachment ${attachment.id} to search index for channel ${channel.id}`);
  }
}
```

The function is now resilient to retry calls. If you look at the code, the common pattern is to store intermediate values in the database, and then check for those values before calling external services. 
