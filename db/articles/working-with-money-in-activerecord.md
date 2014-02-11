Web applications tend to involve keeping track of financial data. I've assembled some tips that I've figured out mostly through trial and error. 

## Integers In The Database

Unless you're dealing with Bitcoin, when you invoice users you'll need to charge them in multiples of the smallest unit of currency. Credit card processing APIs usually require the amount as an integer when generating a charge.  

The naive approach would be to store dollars as doubles and round them to 2 decimal places after each calculation. It's better to store dollars as integer amounts of $0.01 to avoid nasty accounting errors when two 0.005 values are rounded up, and to work with the credit card processor. 

If you have floats at the moment, here's a migration to switch to integers:

```ruby
# db/migrate/#######_change_invoice_amount_to_integer.rb

class ChangeInvoiceAmountToInteger < ActiveRecord::Migration
  def up
    Invoice.all.each do |invoice|
      invoice.update_attribute(:amount, invoice.amount * 100)
    end
    change_column :invoices, :amount, :integer
  end

  def down
    change_column :invoices, :amount, :float
    Invoice.reset_column_information
    Invoice.all.each do |invoice|
      invoice.update_attribute(:amount, invoice.amount / 100)
    end
  end
end
```

## Dollar Amounts

Integers make calculations safe, but you need doubles to use in views. Using cents in the view can get messy, and writing out helper functions gets verbose. 

I think providing the dollar amount as a float is in the domain of the model. Dollar conversion is also a great example for using a Rails 4 *concern* in the implementation. 

```ruby
# app/models/concerns/dollar_amount.rb

module DollarAmount
  extend ActiveSupport::Concern

  included do

    def dollar_amount
      (amount || 0.0) / 100.0
    end

  end
end
```

Include the concern in each model that has an amount field in cents. 

```ruby
# app/models/invoice.rb

class Invoice
  include DollarAmount
end
```

Now in views, you can access the dollar amounts easily:

```erb
<!-- app/views/invoices/_invoice.rb -->

<li class="invoice">
  <%= invoice.created_at.to_s %>:
  <%= number_to_currency invoice.dollar_amount %>
</li>
```

It doesn't look like much, but it's the difference between having empty prices, divisions in the view and other messiness. If your application is used internationally, make sure you're very familiar with the [number_to_currency helper method](http://api.rubyonrails.org/classes/ActionView/Helpers/NumberHelper.html#method-i-number_to_currency). 

## Dollar Calculations

If you want to generate weekly emails to stakeholders with green up arrows and dollar signs preceding large numbers, aggregate calculations make the code base much cleaner.

Add the class level calculation methods you need in the concern:

```ruby
# app/models/concerns/dollar_amount.rb

  included do

    def self.dollar_calculation(operation)
      (calculate(operation, :amount) || 0.0) / 100.0
    end

    def self.dollar_sum
      dollar_calculation(:sum)
    end

    def self.dollar_average
      dollar_calculation(:average)
    end

  end
```

Defining dollar calculations on the collection allows the dollar amount to be generated through an association. For instance, to get a user's total unpaid invoice amount in dollars:

```ruby
user.invoices.where(paid_at: nil).dollar_sum
```

## Payment Is Not A Flag

When I first made my invoices table, I used a boolean flag to signify if it was paid or unpaid. It turned out saving the actual DateTime the payment successfully went through was useful information.

As an example, invoices in the database may not correspond perfectly with credit card payments. If you invoice a user three times, you can allow them to pay all the invoices with one transaction. On the user's records page the invoices can be grouped by when they were paid, and also aggregated into collapsible sections. Not possible with a flag. 

Scopes can be wonderfully semantic as well:

```ruby
# app/models/invoice.rb

class Invoice
  scope :unpaid, -> { where(paid_at: nil) }

  def paid?
    paid_at.present?
  end
end
```

## Percent Change

For reporting, percent change is often a meaningful metric for the customer. How much money did I make this week compared to last week? How many more new users signed up?

Please note that percent change works differently from percent difference or percent error. A change from 10 to 15 is +%50, but a change from 15 to 10 is -%33.3. The correct equation for percent change:

```
100 * (current_value - past_value) / past_value
```