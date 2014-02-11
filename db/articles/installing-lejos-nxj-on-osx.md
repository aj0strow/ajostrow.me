For class, we're supposed to install the LeJOS NXJ SDK. There weren't instructions for macs though, so thought I'd share my steps.

### Check You Have Java

First, you need to have java installed. To check if it's installed properly, open a terminal and make sure the following command doesn't come back with a "command not found" message.

```
$ java && javac
```

If either one isn't found, you need to look up how to add java to your PATH or install JVM / JRE. 

### Install LeJOS

Go to [the leJOS SourceForge page](http://sourceforge.net/projects/lejos/files/) and download the latest version. Unzip it (if you don't have an unzipping tool, check out [The Unarchiver](https://itunes.apple.com/ca/app/the-unarchiver/id425424353?mt=12)). 

Delete the "build" directory. Then move the whole folder to where you keep your sdks. I put mine in /Developer/SDKs. Open up your .profile or .bashrc (where you put environment variables) and point NXJ_HOME to the unpacked folder. 

```
# ~/.profile

export NXJ_HOME="/Developer/SDKs/leJOS_NXJ_0.9.1beta-3"
```

Also add the "bin" directory of the sdk to your path variable. Makes sense to do it for all users, so add a new file to paths.d. Set the path to where you put the sdk, plus bin. To find it echo the environment variable. 

```
$ echo $NXJ_HOME/bin
```

```
# /etc/paths.d/nxj

/Developer/SDKs/leJOS_NXJ_0.9.1beta-3/bin
```

If all went well, nxj should be a command in a fresh terminal window.

```
$ nxj
```

### Eclipse Plugin

In Eclipse, go to { help > Install New Software... } and "work with" the following url:

```
http://lejos.sourceforge.net/tools/eclipse/plugin/nxj/
```

Check the box next to leJOS NXJ Support and click "next >", "next >", agree to the terms & conditions, and "finish". There's some unsigned content. Click "ok". Click "yes" to restart Eclipse. 

### Manual Upload (Bash)

I don't like IDEs. If you don't either, here is the process to manually compile and upload programs for the NXT brick:

```
# clean out the old files, ignore error messages

rm classes/*.class > /dev/null 2>&1
rm *.nxj > /dev/null 2>&1

# compile java code into classes/ dir

find src -type f -name *.java | xargs nxjc -d classes

# make the nxj program

cd classes
nxjlink -o ../ProgramName.nxj ProgramName
cd ..

# upload the program

nxjupload -r ProgramName.nxj
```

### Useful Links

The api documentation is available here: http://www.lejos.org/nxt/nxj/api/index.html