There are a lot of language model programs that rely on structured outputs. The easiest way that I've seen to get JSON from GPT is with chat functions. How it works is you create a fake API with a single function and then tell the model to call that function.

### Function Call Arguments

In the chat completion params, describe the JSON structure that you want. Include the setting to require the model to call the function. In my own usage, I also include a sentence in the prompt about calling the function.

```python
response = openai.ChatCompletion.create(
    # ...
    functions=[
        {
            "name": "get_json",
            "description": "You have to call this function",
            "parameters": {
                "type": "object",
                "properties": {
                    # JSON schema of fields
                },
                "required": [
                    # don't forget to set required fields
                ]
            }
        }
    ],
    function_call={"name":"get_json"},
)

json.loads(response["choices"][0]["message"]["function_call"]["arguments"])
```

### Parse Content Fallback

I've noticed the model will sometimes print the JSON instead of calling the function even with the API param that requires the model to call the function. Until that is fixed, it works to fallback to parse the content.

```python
json.loads(response["choices"][0]["message"]["content"])
```

### Pydantic

It can be nice to make a pydantic class to parse the output and write the JSON shema for you.

```python
from pydantic import BaseModel

class MyResponse(BaseModel):
    # python fields here

# output the JSON schema
MyResponse.model_json_schema()

# parse JSON text
MyResponse.parse_raw("{json text}")
```
