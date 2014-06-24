I'm working on a general-purpose image server in Go. Part of the project is to serve dynamically compressed jpeg files at the requested quality (0 to 100). 

### Decode & Encode

My first attempt was to read in the image from a file, and write it out with a new quality.

```go
// crush.go

package main

import (
  "fmt"
  "os"
  "image/jpeg"
)

func main() {
  for i := 90; i > 0; i -= 10 {
    Crush("image.jpg", i)
  }
}

func Crush(filename string, quality int) {
  file, _ := os.Open(filename)
  defer file.Close()
  img, _ := jpeg.Decode(file)

  // image.jpg -> image@90.jpg
  copyname := fmt.Sprintf("%s@%d.jpg", filename[0:len(filename) - 4], quality)
  copy, _ := os.Create(copyname)
  jpeg.Encode(copy, img, &jpeg.Options{ Quality: quality })
}
```

It's quick and dirty (no error checking) but it achieves the goal of lossy image compression. Let's take it for a spin.

```go
import "time"

func Crush(filename string, quality int) {
  start := time.Now()

  // previous Crush code

  elapsed := time.Since(start).Seconds()
  fmt.Printf("%s: %s ~ %.2fs\n", copyname, stat(file, copy), elapsed)
}

func stat(file, copy *os.File) string {
  before, after := size(file), size(copy)
  pct := 100.0 - 100.0 * (float64(after) / float64(before))
  return fmt.Sprintf("%d --> %d (%.2f%%)", before, after, pct)
}

func size(file *os.File) int64 {
  stat, _ := file.Stat()
  return stat.Size()
}
```

Running the program creates nine new images and prints some information. 

```
$ go run crush.go
image@90.jpg: 4166906 --> 2634955 (36.76%) ~ 1.42s
image@80.jpg: 4166906 --> 1611460 (61.33%) ~ 1.35s
image@70.jpg: 4166906 --> 1286538 (69.12%) ~ 1.37s
image@60.jpg: 4166906 --> 1072509 (74.26%) ~ 1.36s
image@50.jpg: 4166906 --> 931004 (77.66%) ~ 1.34s
image@40.jpg: 4166906 --> 806931 (80.63%) ~ 1.34s
image@30.jpg: 4166906 --> 674063 (83.82%) ~ 1.32s
image@20.jpg: 4166906 --> 520800 (87.50%) ~ 1.28s
image@10.jpg: 4166906 --> 335942 (91.94%) ~ 1.30s
```

### Real Compression

Curious to see how ten lines of Go stacked up against proven compression tools, I searched for a while and came upon **[tjko/jpegoptim](https://github.com/tjko/jpegoptim)** used by the [imageoptim](https://imageoptim.com/) tool. 

```
$ brew install jpegoptim
$ jpegoptim --help
```

Try it out with a quality of 80. 

```
$ jpegoptim --dest=tmp --max=80 image.jpg
image.jpg (...) 4166906 --> 1609028 bytes (61.39%), optimized.
```

Sweet. The Go program got 61.33% for 80, which is basically the same. They must be doing a little lossless optimization to achieve the extra 0.06%, but it's insignificant. It does seem faster tho.  

```ruby
# crush.rb

require 'benchmark'

def crush(filename, quality)
  copyname = '%s@%d.jpg' % [ filename[0...-4], quality ]
  bm = Benchmark.measure do
    `jpegoptim --stdout --max=#{quality} #{filename} > #{copyname}`
  end
  puts '~ %.2fs' % bm.total
end

(10..90).step(10).to_a.reverse.each do |i|
  crush("image.jpg", i)
end
```

And the results.

```
$ ruby crush.rb
image.jpg 2448x3264 24bit N ICC Exiff XMP JFIF  [OK] 4166906 --> 2615012 bytes (37.24%), optimized.
~ 0.57s
image.jpg 2448x3264 24bit N ICC Exiff XMP JFIF  [OK] 4166906 --> 1609028 bytes (61.39%), optimized.
~ 0.50s
image.jpg 2448x3264 24bit N ICC Exiff XMP JFIF  [OK] 4166906 --> 1280427 bytes (69.27%), optimized.
~ 0.47s
image.jpg 2448x3264 24bit N ICC Exiff XMP JFIF  [OK] 4166906 --> 1062805 bytes (74.49%), optimized.
~ 0.46s
image.jpg 2448x3264 24bit N ICC Exiff XMP JFIF  [OK] 4166906 --> 917364 bytes (77.98%), optimized.
~ 0.45s
image.jpg 2448x3264 24bit N ICC Exiff XMP JFIF  [OK] 4166906 --> 787728 bytes (81.10%), optimized.
~ 0.43s
image.jpg 2448x3264 24bit N ICC Exiff XMP JFIF  [OK] 4166906 --> 645179 bytes (84.52%), optimized.
~ 0.43s
image.jpg 2448x3264 24bit N ICC Exiff XMP JFIF  [OK] 4166906 --> 482212 bytes (88.43%), optimized.
~ 0.43s
image.jpg 2448x3264 24bit N ICC Exiff XMP JFIF  [OK] 4166906 --> 279443 bytes (93.29%), optimized.
~ 0.39s
```

Aha! It is faster. Much faster. 

### Stream Duplex

To match the i/o interface of the Go program, I had to redirect the image from stdout to the desired file because the program only allows for a destination directory. 

```
$ jpegoptim --help 2>&1 | grep std
  --stdout          send output to standard output (instead of a file)
  --stdin           read input from standard input (instead of a file)
```

Very interesting! The program can effectively be an image compression stream duplex. Time to rewrite the crushing code to use streams.

```go
import (
  "os/exec"
  "io"
)

func Crush(filename string, quality int) {
  start := time.Now()

  file, _ := os.Open(filename)
  copyname := fmt.Sprintf("%s@%d.jpg", filename[0:len(filename) - 4], quality)
  copy, _ := os.Create(copyname)
  jpegoptim(file, copy, quality)

  elapsed := time.Since(start).Seconds()
  fmt.Printf("%s: %s ~ %.2fs\n", copyname, stat(file, copy), elapsed)
}

func jpegoptim(reader io.Reader, writer io.Writer, quality int) {
  max := fmt.Sprintf("--max=%d", quality)
  cmd := exec.Command("jpegoptim", "--stdin", "--stdout", max)
  cmd.Stdout = writer
  cmd.Stdin = reader
  cmd.Run()
}

// main, stat, size unchanged
```

It's about three times faster, and compresses the image about 1% more. An improvement for sure. 

```
image@90.jpg: 4166906 --> 2615012 (37.24%) ~ 0.55s
image@80.jpg: 4166906 --> 1609028 (61.39%) ~ 0.50s
image@70.jpg: 4166906 --> 1280427 (69.27%) ~ 0.46s
image@60.jpg: 4166906 --> 1062805 (74.49%) ~ 0.44s
image@50.jpg: 4166906 --> 917364 (77.98%) ~ 0.43s
image@40.jpg: 4166906 --> 787728 (81.10%) ~ 0.43s
image@30.jpg: 4166906 --> 645179 (84.52%) ~ 0.42s
image@20.jpg: 4166906 --> 482212 (88.43%) ~ 0.40s
image@10.jpg: 4166906 --> 279443 (93.29%) ~ 0.39s
```

### Server Caveat

The http.Request.Body and http.ResponseWriter can be used as a reader and writer respectively. I thought it would be possible to implement a streaming echo compression server, but unfortunately it's not possible to read from the request and write to the response at the [same damn time](https://www.youtube.com/watch?v=e0Y39QnwRvY). 

The next challenge is to find out if the command can act as a duplex stream to compress a request body and write it to the cloud without ever saving the image to disk. Tweet if you figure it out [@aj0strow](https://twitter.com/aj0strow). 
