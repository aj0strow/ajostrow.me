Overlays are a great tool for augmenting images with application data. For example, in a shopping application you might want to draw circles around products that are for sale. 

```html
<div style="position: relative;">
  <img src="outfit.jpg">
  <svg style="position: absolute;">
    <circle stroke="blue" stroke-width="2">
  </svg>
</div>
```

It can be tricky to build overlays because you need to keep the background fully transparent to see the image underneath. It turns out that lots of drawing techniques rely on the order of background filling to cover parts that should not be seen. 

### Drawing Lines Between Shapes

In the shopping overlay, you might want to draw a line connecting the left and right shoe in a pair of shoes, because it is one product. Normally to connect two shapes with a line, you can draw the line first between the center points, then draw the shapes, and it looks like the line starts at the border of the shapes. 

```html
<!-- circles with fill will cover the image -->
<svg viewBox="0 0 600 400">
  <line x1="120" y1="60" x2="220" y2="180" stroke="blue" stroke-width="2">
  <circle cx="120" cy="60" r="10" fill="blue">
  <circle cx="220" cy="180" r="20" fill="blue">
</svg>
```

It is different with overlays. We have to be able to see the shoes in the image. It will not work to draw a line between the center points, because the circles need to be transparent, and will not cover the part of the line that is intersecting the circles.  

```html
<!-- lines are visible inside of circles -->
<svg viewBox="0 0 600 400">
  <line x1="120" y1="60" x2="220" y2="180" stroke="blue" stroke-width="2">
  <circle cx="120" cy="60" r="10" fill="transparent" stroke="blue" stroke-width="2">
  <circle cx="220" cy="180" r="20" fill="transparent" stroke="blue" stroke-width="2">
</svg>
```

At this point you might be tempted to google "how to calculate closest point on circle". That is a bad idea because it will not take into account a third item that might intersect the line between two connected items. It will not look professional to draw a line through another product. 

### Defining a Mask

Another way to think about the problem is not drawing lines between shapes, but preventing lines from rendering inside of shapes. There is a way to prevent rendering in parts of the drawing using the [SVG mask element](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask).

```html
<svg viewBox="0 0 600 400">
  <defs>
    <circle id="left-shoe" cx="120" cy="60" r="10">
    <circle id="right-shoe" cx="220" cy="180" r="20">
  </defs>
  <mask id="hide-within-product">
    <rect x="0" y="0" width="100%" height="100%" fill="white">
    <use href="#left-shoe" fill="black">
    <use href="#right-shoe" fill="black">
  </mask>
  <g mask="url(#hide-within-product)">
    <line x1="120" y1="60" x2="220" y2="180" stroke="blue" stroke-width="2">
  </g>
  <use href="#left-shoe" fill="transparent" stroke="blue" stroke-width="2">
  <use href="#right-shoe" fill="transparent" stroke="blue" stroke-width="2">
</svg>
```

It works now. The connecting lines appear to start at the borders, and most importantly there will never be connecting lines over products. 

### Overlays in Applications

In the examples above the drawing uses static values, but in a web application the overlay would use identifiers and coordinates that depend on data. 

```jsx
<defs>
  {products.map(product => {
    return <circle id={product.id} cx={product.cx} cy={product.cy} r={product.r} />
  })}
</defs>

<mask id="hide-within-product">
  <rect x="0" y="0" width="100%" height="100%" fill="white">
  {products.map(product => {
    return <use href={`#${product.id}`} fill="black">
  })}
</mask>

<g mask="url(#hide-within-product)">
  {pairs.map(([left, right]) => {
    return <line x1={left.cx} y1={left.cy} x2={right.cx} y2={right.cy} stroke="blue" strokeWidth="2">
  })}
</g>

{products.map(product => {
  return <use href={`#${product.id}`} fill="transparent" stroke="blue" strokeWidth="2">
})}
```

No math required. For transparent overlays, the [SVG mask element](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask) does all the heavy lifting. 
