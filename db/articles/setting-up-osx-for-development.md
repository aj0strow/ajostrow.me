There are a number of software packages you should get if you want to do certain types of development. I always have a hard time installing things correctly, so I'll go through the steps I used.

## Folder setup

Ignore this if you know how you like to organize things.

Before you start downloading things and creating projects, it's a good idea to figure out where new things will all go. I personally put code and project information in ~/Documents/code, applications in ~/Applications, and SDKs in /Developer/SDKs.

Organization is all preference, but it'll make your life easier to pick specific spots for things and always put those types of things in those specific spots. Software installed by package managers usually install to the right place, so you don't have to worry about it.

## TextWrangler

TextWrangler by Bare Bones is a fantastic text editor with few features beyond syntax highlighting. We'll use it to make files that TextEdit would mess up with formatting.

You can [get it from the App Store][1] or [on the Bare Bones site][2]. Once you have dragged it into Applications, open it, and check the 'Install command line tools' option, continue.

## Profile file

Create a file in /Users/your-user-name, aka ~, called ".profile" where you'll save environment variables for programs and update the path variable.

Note: to check if the file is there, list the files with hidden files shown:

```
$ ls -a ~
```

and you should see '.profile' in the list of files. To open .profile in TextWrangler, use:

```
$ edit ~/.profile
```

## System-wide $PATH

The $PATH environment variable is a list of colon-separated paths where the shell looks for to find program names. The default order for all users on the machine is in /etc/paths. Open it up, and change the order to be compatible with package managers:

```
$ edit /etc/paths
```

And in /etc/paths (newline at the end is important) (order is also important):

```
/usr/local/bin
/usr/local/sbin
/usr/bin
/bin
/usr/sbin
/sbin

```

To add more paths, make a /etc/paths.d/ folder and put more path files there. Again, this is system-wide. To add paths just for a specific user, you can append to the $PATH variable in "~/.profile" like so:

```
# add /new/path/to/add to path
export PATH=/new/path/to/add:$PATH
```

## Git

Git is the premiere version control system in my eyes, and it's very beneficial to upload your code to GitHub as well. More to the point of this article, it's used to update Homebrew and many other necessities.

Go to the [git downloads][3] page and use the installer.

## Xcode

You'll need the command line tools for Xcode as well. It comes up again and again as a dependency. If you have OSX 10.7 (Lion) or up, go to the [Apple Downloads for Developers site][5] and download the command line tools for your OS version.

If you have Snow Leopard, you can still get Xcode 4.2, but you need a paid developer account with Apple (costs $99) or you can torrent it. If you do torrent it, you'll have to set your system date in System Settings to before January 2011 or it won't install. Also, Xcode 3.6.2 is free and should work for your installing needs.

From what I've read online, you should include the optional UNIX Command Tools, because it's a pain to go back and update later. It's used for C development, and is under 400 Mb.

## Homebrew

[Homebrew][4] is an incredibly easy to use and transparent package manager for OSX. "Homebrew installs the stuff you need that Apple didn’t."

To install it, paste this command into Terminal:

```
$ ruby -e "$(curl -fsSkL raw.github.com/mxcl/homebrew/go)"
```

You'll see after the install that you need Xcode, so I hope you installed it. If not, install Xcode and come back. Run the following command to get Homebrew ready to use.

```
$ brew doctor
```

## Node.js and Node Package Manager

Regardless if you use node.js or not, more and more software is relying on the server-side V8 JavaScript implementation and npm, or Node Package Manager. I'll give two ways to install them, the first with Homebrew:

```
$ brew install node
```

Unfortunately npm does not come with the homebrew installation anymore, so you'll have to get npm independently.

```
$ curl http://npmjs.org/install.sh | sh
```

Or you can go to the [node.js website][6] and choose the installer for your platform. If you install it this way, you need to claim ownership of the folder it installs to, or Homebrew may have issues writing header files. So run the following command:

```
$ sudo chown -R `whoami` /usr/local/include
```

Either way once you have node and npm installed, you need to follow up with adding paths to your .profile file. These are basically environment variables that are set at each login.

```
$ edit ~/.profile
```

Add the following lines and save .profile

```
export NODE_PATH=/usr/local/lib/node
export PATH=/usr/local/share/npm/bin:$PATH
```

Afterwards, close and reopen all command prompts.

## Eclipse

If you don't develop in Java, C/C++ or Android, skip this section.

I always download the classic eclipse, and then install software as needed. I'll walk through how to install C/C++ developing tools and the Android sdk as well. But first, go to the [eclipse foundation downloads page][7] and get the latest Eclipse Classic. If you have a moderately recent computer, you are 64-bit architecture.

Open eclipse, and choose a workspace. A workspace is a folder where projects live. Usually you want it to be a logical division among projects, like you could have one for school, and one for side projects. You can point it to an existing folder, or have it create a new folder at the given path. The default Documents/workspace is fine as well.

You now have Java taken care of! Next lets get C and C++ working as well. In Eclipse go to <Help> menu item and choose "Install new software...". Go to the [CDT Downloads page][8] (CDT stands for C/C++ Development Toolkit) and find the p2 software repository link for your version of Eclipse. If you got the latest version, it should be at the top. The link should look like

Enter the url in work with this url bar, and choose any name, I put mine as "CDT". Then you should get unchecked boxes for "CDT Main Features" and "CDT Optional Features". I only selected main features. Follow instructions to install and let it restart eclipse.

## Python

Mac computers come with python, but I wanted the lastest version. So install python's dependencies and then python with Homebrew. Note that if you aren't the owner of /usr/local be sure to claim ownership.

```
$ sudo chown -R `whoami` /usr/local
```

Then install python and its dependencies with Homebrew

```
$ brew install readline sqlite gdbm
$ brew install python --universal --framework
```

It'll take a while. Then we need to edit the .profile again to add the new python location to the PATH variable so the Homebrew version of python is used instead of the system version.

```
# ~/.profile

PATH=/usr/local/share/python:$PATH
```

Now you should be have the latest stable release of python. Also, most python development relies on the Python Package Index, so install that too:

```
$ easy_install pip
```

## Ruby

Mac computers also come with ruby, but not the latest version. Use Hombrew to install it:

```
$ brew install ruby
```

It takes a while. Then update your path in the profile file. Check which ruby version Homebrew installed, I got "1.9.3-p194". Then add it to your path:

```
# ~/.profile

PATH=/usr/local/Cellar/ruby/1.9.3-p194/bin:$PATH
```

## Rails

I don't use the built-in documentation ever, so to save gem installation time I don't install them. To set permanent flags to the bundle commands, make a file ~/.gemrc and add these lines:

```
install: --no-rdoc --no-ri
update:  --no-rdoc --no-ri
```

Then install rails:

```
$ gem install rails
```

## MAMP

MAMP is an acronym standing for Mac Apache MySQL PHP. On Windows it is WAMP and on Linux (the most popular) it is LAMP. Basically it's a typical application stack for php development. Go to [the MAMP site][11] and download the one-click installer.

## Unarchiver

This is not really for development, but is very useful. Go to the [Unarchiver site][10] and download it for free. It opens most archive types, like Zip, RAR, 7-zip, Tar, Gzip and Bzip2.

[1]: http://itunes.apple.com/ca/app/textwrangler/id404010395?mt=12 'Text Wrangler Download on App Store'
[2]: http://www.barebones.com/products/textwrangler/ 'Text Wrangler Download on Bare Bones Site'
[3]: http://git-scm.com/downloads 'Git Downloads'
[4]: http://mxcl.github.com/homebrew/ 'Homebrew'
[5]: https://developer.apple.com/downloads/index.action 'Apple Dev Downloads'
[6]: http://nodejs.org/download/ 'Node.js Downloads'
[7]: http://www.eclipse.org/downloads/ 'Eclipse Foundation Downloads'
[8]: http://www.eclipse.org/cdt/downloads.php 'CDT Downloads'
[9]: http://www.aptana.com/products/studio3/download 'Aptana Studio Download'
[10]: http://itunes.apple.com/ca/app/the-unarchiver/id425424353?mt=12 'Unarchiver download'
[11]: http://www.mamp.info/en/index.html 'MAMP Download'
