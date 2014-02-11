Suppose you want to implement a posts endpoint, with optional parameters. Start by fetching a reasonable number of rows. 

```ruby
get '/posts' do
  posts = Post.limit(15)
end
```

Next, for user timelines you want to allow an optional user parameter that takes the id. Using chained query syntax results in code like the following:

```ruby
posts = posts.where(user_id: params[:user]) if params[:user].present?
```

However now you want to allow the user to be specified by id or by username. A helper makes sense:

```ruby
def user
  (param = params[:user]).presence and User.any(id: param, username: param).first
end
```

Simply plugging in the helper would be wasteful because it could incur a second database call, and at least hit the cache which is fast, but not instant. 

```ruby
# bad
posts = posts.where(user_id: user.id) if user.present?
```

Instead, shadow the method call in a tap block.

```ruby
user.tap do |user|
  posts = posts.where(user_id: user.id) if user.present?
end
```

This is a fairly contrived example, but the concept is helpful in many situations.