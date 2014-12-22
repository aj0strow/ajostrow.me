A client requested we add detection for when a user is typing. Stealing from skype, it listens to text changes and toggles the state back after seven seconds. I don't know how to make gifs, but i do know css. The goal is to animate utf-8 bullet point letters to convey someone is typing. 

```html
<div>
  <span class="dot">•</span>
  <span class="dot">•</span>
  <span class="dot">•</span>
</div>
```

The stylesheet is the interesting part. To make the left-to-right motion, the dots need to be different opacities at different points in time. First define a base state, three mostly transparent dots.

```css
.dot {
  font-size: 20px;
  margin: 0 -1px;
  color: red;
  opacity: 0.2;
}
```

Next add an animation for each dot. The trick to defining keyframe states is to take transitioning into account. Look at the first keyframe animation. At 0% time it starts transitioning so that its at 1 opacity by 25% time, and starts transitioning again to be back at 0.2 opacity by 60% time. 

```css
.dot {
  animation-duration: 1.6s;
  animation-delay: 0s;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

.dot:nth-child(1) { animation-name: one; }
.dot:nth-child(2) { animation-name: two; }
.dot:nth-child(3) { animation-name: three; }

@keyframes one {
  25% { opacity: 1; }
  60% { opacity: 0.2; }
}

@keyframes two {
  10% { opacity: 0.2; }
  45% { opacity: 1; }
  70% { opacity: 0.2; }
}

@keyframes three {
  20% { opacity: 0.2; }
  60% { opacity: 1; }
  80% { opacity: 0.2; }
}
```

There were two take-aways for me. First, use a non-zero base opacity. Using opacity 0.2 looked way better than 0. A second tip is to give ample overlap % time. Animations started when a previous one ends look choppy. 
