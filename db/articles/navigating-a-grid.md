For a class project, we're programming Lejos NXT lego robots to compete in capturing styrofoam blocks on a wooden grid. It must search for foam, capture the foam, and deposit the foam in a specific location on the grid as quickly as possible. 

There are many nuances to the challenge, such as filtering faulty sensor readings, mutli-threading, and working with like 0.25 Mb of memory. 

### Independent of the Brick

The biggest challenge with writing software for the Lejos NXT brick is that debugging is horrendous. When an error occurs, there is no stacktrace, and a cryptic number shows up which is often absent from search engine results.

Developing a navigation toolset independent of any NXT packages allows the logic to be properly debugged and profiled. The goals are:

* model the grid with the edges and other information
* keep track of obstacles (which points are safe / unsafe)
* record breadcrumb history to help with searching for blocks
* generate shortest path for navigation that avoids obstacles

### Modeling the Grid

Considering the memory limitations, we decided to lower the resolution to 10cm x 10cm lattice points. The robot is at least as large, and more precision would be overkill. 

Initially I put the safe points in a HashSet, but that proved to consume too much memory, so switched to a 2D array.

```java
// Grid.java

public class Grid {
   private static final int SEPARATION = 10; // centimeters

   private int width, height; // centimeters
   private int rows, columns;
   private int[][] grid;
			
   // initialize with width and height of grid in centimeters
   public Grid(int width, int height) {
      this.width = width;
      this.height = height;
      this.rows = width / SEPARATION + 1;
      this.columns = height / SEPARATION + 1;

      grid = new int[rows][columns];
   }

   // x -> row
   private int row(int x) {
      return Math.min(rows - 1, Math.max(0, sep(x)));		
   }
	
   // y -> column
   private int col(int y) {
      return Math.min(columns - 1, Math.max(0, sep(y)));
   }
	
   // x -> row, y -> column (no checks)
   private int sep(int coordinate) {
      return coordinate / SEPARATION;
   }
	
   // row -> x, column -> y
   private int coord(int separation) {
      return separation * SEPARATION;
   }
}
```

The grid is an int[][] so we can keep track of how many times we visit each point to help with searching for blocks, and check if there are obstructions.

### Avoiding Obstacles

The grid should keep track of obstacles, so the robot never suffers a collision. For the model, if an array value is negative, the grid position is considered unsafe.

```java
// Grid.java

private static final int UNSAFE = -5;

private boolean unsafe(int row, int column) {
   return grid[row][column] < 0;
}
	
private boolean safe(int row, int column) {
   return !unsafe(row, column);
}
	
public void report(int x, int y) {
   int row = row(x), col = col(y);
   int current = grid[row][col];
   grid[row][col] = (current >= 0) ? -1 : current - 1;
}

// all edge points are "unsafe"
private void reportEdges() {
   for (int col = 0; col < columns; col ++) {
      grid[0][col] = UNSAFE;
      grid[rows - 1][col] = UNSAFE;
   }

   for (int row = 1; row < rows - 1; row ++) {
      grid[row][0] = UNSAFE;
      grid[row][columns - 1] = UNSAFE;
   }
}
```

Calling reportEdges() in the initializer allows the grid to be bounded. That's a good thing! The robot should not travel off the playing area. 

The robot can report the location to the grid using the report(x, y) method, and the closest lattice point will be marked unsafe. It is only set to -1 and then decremented further in case the obstruction is temporary, such as another robot. 

### Printing

To properly debug it helps if you can inspect the object. Here's a toString method:

```java
// prints large grid. not suitable for lejos LCD
public String toString() {
   String str = "-- Grid width=" + width + " height=" + height;
   str += " rows=" + rows + " columns=" + columns + "\n";		

   for (int col = 0; col < columns; col++) {
      for (int row = 0; row < rows; row++) {
         if (unsafe(row, col)) str += "*";
         else str += grid[row][col];
         str += " ";
      }
      str = str.trim() + "\n";
   }
   return str;
}
```

It prints stuff like:

```
-- Grid width=120 height=120 rows=13 columns=13
* * * * * * * * * * * * *
* 0 0 0 0 0 0 0 0 0 0 0 *
* 0 0 0 0 0 0 0 0 0 0 0 *
* * 0 0 0 0 0 0 0 0 0 0 *
* 0 * 0 0 0 0 0 0 0 0 0 *
* 0 0 0 0 0 0 0 0 0 0 0 *
* 0 0 0 0 0 0 0 0 0 0 0 *
* 0 0 0 0 0 0 0 0 0 0 0 *
* 0 0 0 0 0 0 0 0 0 0 0 *
* 0 0 0 0 0 0 0 0 0 0 0 *
* 0 0 0 0 0 0 0 0 0 0 0 *
* 0 0 0 0 0 0 0 0 0 0 0 *
* * * * * * * * * * * * *
```

### Point

The grid needs to eventually return a list (x, y) pairs for shortest path. It makes sense to model the coordinate pair as a Point object to get pretty printing, equality tests, and hashing versus using a length-2 array.

```java
// Point.java

public class Point {
   protected int x, y;

   public Point(int x, int y) {
      this.x = x;
      this.y = y;
   }

   public int distanceTo(Point point) {
      int dx = point.x - x, dy = point.y - y;
      double sqrt = Math.sqrt(dx * dx + dy * dy);
      return (int) Math.round(sqrt);
   }

   @Override
   public String toString() {
      return "(" + x + "," + y + ")";
   }
		
   @Override
   public int hashCode() {
      int hash = 7;
      hash = hash * 71 + x;
      hash = hash * 71 + y;
      return hash;
   }
	
   @Override
   public boolean equals(Object o) {
      if (o instanceof Point) {
         Point point = (Point) o;
         return x == point.x && y == point.y;
      } else {
         return false;
      }
   }
}
```

### Shortest Path

The robot won't collide into obstacles, and the grid class can return Point lists. It's time for shortest path navigation. There are a number of approaches available, but I found recursive depth-first search to be the simplest and most preformant. 

The first step is to get all of the neighboring points that are not obstacles.

```java
// Grid.java

/*
* safeNeighborsOf(p) returns neighbors that have save (x, y)
*/
private LinkedList<Point> safeNeighborsOf(Point point) {
   LinkedList<Point> safeNeighbors = new LinkedList<Point>();
   for (Point neighbor : neighborsOf(point)) {
      if (safe(neighbor)) safeNeighbors.add(neighbor);
   }
   return safeNeighbors;
}
   
/*
* neighborsOf(p) returns all points around it:
* 
*    * * *
*    * p *    ->   [ 8 point array]
*    * * *
*/
private Point[] neighborsOf(Point point) {
   int x = point.x, y = point.y;
      
   return new Point[] {
      new Point(x - SEPARATION, y - SEPARATION),
      new Point(x, y - SEPARATION),
      new Point(x + SEPARATION, y - SEPARATION),
      new Point(x - SEPARATION, y),
      new Point(x + SEPARATION, y),
      new Point(x - SEPARATION, y + SEPARATION),
      new Point(x, y + SEPARATION),
      new Point(x + SEPARATION, y + SEPARATION)
   };
}
```

The safe neighbors must be sorted in ascending order by distance to destination. The polynomial complexity for the sorting is acceptable because the list has at most length 8.  

```java
// sort points by min distance to destination
private LinkedList<Point> sort(LinkedList<Point> points, Point destination) {
   LinkedList<Point> sorted = new LinkedList<Point>();   
   while (!points.isEmpty()) {
      Point min = closest(points, destination);
      points.remove(min);
      sorted.add(min);
   }
   return sorted;
}
   
/*
*  closest([points], point) returns the closest point in distance to the
*  destination
*/
private Point closest(LinkedList<Point> points, Point destination) {
   Point min = null;
   int minDistance = Integer.MAX_VALUE;
   for (Point point : points) {
      int distance = point.distanceTo(destination);
      if (distance < minDistance) {
         minDistance = distance;
         min = point;
      }
   }
   return min;
}
```

Using the above helper methods, depth first path-finding is fairly straight-forward. The goal is to recursively build the shortest path using the call stack to go through all options if necessary.

```java
// Grid.java

// shortest path
public LinkedList<Point> depthFirst(Point a, Point b) {
   LinkedList<Point> path = null;
   if (a.equals(b)) {
      path = new LinkedList<Point>();
      path.add(a);   
   } else {
      for (Point point : sort(safeNeighborsOf(a), b)) {
         path = depthFirst(point, b);
         if (path != null) {
            path.add(0, a);
            break;
         }
      }
   }     
   return path;
}
```

I added a temporary instance variable "count" to Grid to count the recursive calls, and it used about 10x fewer iterations than breadth-first search and was 5x faster when comparing elapsed nano seconds with System.nanoTime(). 

### Breadcrumbs and Searching

Now that the robot can navigate, it needs to search for styrofoam blocks. The logic involved searching with ultrasonic sensors, but if nothing is found the robot needs to wander on a random path to continue the search.

```java
// Grid.java

public void checkin(int x, int y) {
   int row = row(x), col = col(y);
   int current = grid[row][col];
   if (current > UNSAFE) grid[row][col] = current + 1;
}

// least-traveled-to safe neighboring point
public Point wanderFrom(Point location) {
   Point freshest = null;
   int minCount = Integer.MAX_VALUE;
			
   for (Point point : safeNeighborsOf(location)) {
      int count = grid[row(point.x)][col(point.y)];
      if (count < minCount) {
         minCount = count;
         freshest = point;
      }
   }
   return freshest;
}
```

The robot should automatically check in as part of the odometry process (running in another thread) so that wandering is simplified.

### Conclusion

With the Grid and Point classes, our robot's navigation is mostly abstracted leaving only object detection and actual motor instructions to the main loop. 

Keeping navigation logic separate of lego hardware allowed it to be tested and debugged outside of the Lejos environment. 