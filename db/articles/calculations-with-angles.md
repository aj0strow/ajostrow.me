At McGill I've been programming LeJOS NXT lego robots. Much of the calculations involve working with angles, which can be deceptively tricky. 

## Radians

Use radians exclusively. All of the trigonometric functions defined in the Math class take a double in radians. 

You can get the Degrees for displaying purposes easily too: 

```java
double degrees = Math.toDegrees( radians );
```

## Wrap Around

Keep in mind that 0 and 2π are the same angle. Duh! It's important though, for instance if you are calculating the difference between two angles, you can't just subtract them. If you are finding the average of angles, you can't just sum them. 

The cleanest way I've found to deal with wrap around is to normalize the angle after every calculation. That way all angles will follow the rule 0 <= angle < 2π. 

```java
private static double normalize(double angle) {
   double normalized = angle % (2 * Math.PI);
   if (normalized < 0) normalized += 2 * Math.PI;
   return normalized;
}
```

## Left Or Right?

Given a start angle and a stop angle, should you turn left or right to spin the least? It took me a long time to figure it out. But with normalized start and stop angles, it's straight-forward:

```java
double goingLeft = normalize(startAngle - stopAngle);
double goingRight = normalize(stopAngle - startAngle);

if (goingLeft < goingRight) {
  // turn left
} else {
  // turn right
}
```

## Basic Calculations

You can't just use subtraction to get the difference between two angles, you need to check for wrap-around first. To get the difference between two angles:

```java
private static double difference(double startAngle, double stopAngle) {
   if (stopAngle < startAngle) stopAngle += 2 * Math.PI;
   return stopAngle - startAngle;
}
```

Then to get the angle in between two angles:

```java
private static double angleBetween(double startAngle, double stopAngle) {
   return normalize(startAngle + difference(startAngle, stopAngle) / 2);
}
```

## Using Tangent

When using an angle to specify a direction on a plane, sines and cosines tend to just work providing the correct positive and negative values. Tangents are a bit different.

We used tangents to correct the robot's internal position based on sensing lines on a grid. To do that, we multiplied the tangent of the angle with the distance between lines. When you're using a tangent, double check if you want the whole angle, or just the quarter angle.

```java
Math.tan(angle % (Math.PI / 2))
```