It took two complete days to install the [React Native](https://facebook.github.io/react-native/) welcome page on my phone. I should clarify -- it took 1.5 days fighting with Xcode and various Apple developer portals getting nowhere before I found an article that mentioned [`fastlane`](https://fastlane.tools/). 

After, it took one afternoon. I wrote down each step so other first-time React Native developers find the process less intimidating. 

### Apple ID

Create a personal Apple ID. You might already have one for iTunes or other Mac products. It should be a personal email address not tied to a company. If it's a work app, you need to create a second Apple ID tied to a work email address. 

When you associate an Apple ID email address with a developer account it's associated for life. So make sure to use a personal email for an individual account, or use a work email for a business account. 

### Developer Account

Purchase an "Individual Membership" for your personal Apple ID. Even if you want to release the app under a business entity, it's such a hassle that I'd suggest deploying first on a personal account and migrate the app to production on a business account down the road. 

It's an extra $100 to save time. 

### React Native

Follow the docs and start a new project. 

```
$ react-native init AppName
```

Let the setup run ...

```
$ cd AppName
```

Set up the repository too.

```
$ git init
$ git add .
$ git commit -m 'initial commit'
```

### Fastlane

Install using [Homebrew cask](https://caskroom.github.io/).

```
$ brew cask install fastlane
```

Add fastlane to your system path.

```
# ~/.bashrc

export PATH="$HOME/.fastlane/bin:$PATH"
```

Open a new terminal window to use the new system path. 

Fastlane comes with an interactive setup process. 

```
$ fastlane init
```

```
Is this project an iOS project? (y/n)
> y
```

When you specify the project file don't try to use tab completion, it doesn't work.

```
Couldn't automatically detect the project file, please provide a path:
> ios/AppName.xcodeproj
```

```
Your Apple ID (e.g. fastlane@krausefx.com):
> personal@gmail.com
```

App IDs usually use your domain name. If the domain name is solely for the app, you can use `app` as the actual name `com.appname.app`. Otherwise use `com.mydomain.appname`. 

```
App Identifier (com.krausefx.app):
> com.mydomain.appname
```

You might need to select which developer account. Choose your personal one. 

```
Multiple iTunes Connect teams found, please enter the number of the team you want to use: 
Note: to automatically choose the team, provide either the iTunes Connect Team ID, or the Team Name in your fastlane/Appfile:
> 1
```

I can't find docs saying so, but "scheme name" means your main application name. 

```
Optional: The scheme name of your app (If you don't need one, just hit Enter):
> AppName

Created new file './fastlane/Fastfile'. Edit it to manage your own deployment lanes.
```

You should have a new `./fastlane` directory with `Appfile` and `Fastfile`. Set your text editor to use Ruby syntax highlighting. 

### Appfile

If you have multiple developer accounts, set the iTunes Connect Team ID in `Appfile`. 

```rb
# fastlane/Appfile

itc_team_id "##########"
```

### Match Certs

Create a new private git repository in the cloud. I called mine `certs`. Fastlane needs a fresh repository to store Apple code signing certificates. 

```
$ match

To not be asked about this value, you can specify it using 'git_url'
URL to the git repo containing all the certificates: 

> git@github.com:USER/REPO.git
```

If you use GitHub and 2-factor auth, use the SSH repository endpoint. Otherwise the HTTPS repository endpoint should work too. Enter any passcode. You should see files and directories if you refresh the repository online. 

```
All required keys, certificates and provisioning profiles are installed 🙌
```

Add two entries to `.gitignore` for later.

```
*.cer
*.mobileprovision
```

### Xcode Settings

Unfortunately, Xcode defaults to automatic certificate management but it doesn't work. Open `./ios/AppName/AppDelegate.m` using Xcode. 

Change **Identity** settings.

```
Display Name: App Name
Bundle Identifier: com.mydomain.appname
Version: 1.0.0
Build: 1
```

Under **Signing** uncheck *Automatically manage signing*. 

Under **Signing (Debug)** select your development provisioning profile. 

Under **Signing (Release)** select your adhoc provisioning profile. 

If there aren't any profiles with your bundle identifier in the dropdown you need to go back to the *Match Certs* section and actually do it. 

### React Bundle

Edit `./ios/AppName/AppDelegate.m` to switch the jsCodeLocation depending on the presence of a `DEBUG` build flag. 

```obj-c
#ifdef DEBUG
  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];
#else
  jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif  
```

Add a script file `./fastlane/bundle` to bundle the React Native javascript app. 

```bash
#!/bin/bash

cd ..

react-native bundle --dev false --platform "ios" --entry-file "./index.ios.js" --bundle-output "./ios/main.jsbundle"
```

Make the script executable.

```
$ chmod +x fastlane/bundle
```

### Register Devices

You can't install a beta app without adding the device UDID to the provisioning profile. Look up your device name and UDID using iTunes (search online how to). Create a file `ios/devices.tsv` where you list each device.

The file extension is `.tsv` for *tab-separated values* despite my markdown processor converting to spaces in the snippet below. 

```
Device ID	Device Name
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX	Person's iPhone
```

### Beta Build

Configure the beta release process. 

```rb
# ./fastlane/Fastfile

platform :ios do
  desc "Push latest Beta version."
  lane :beta do
    
    # Register beta testers.
    register_devices(device_file: "ios/devices.tsv")
    
    # Reload provisioning profile. 
    match(type: "adhoc", force_for_new_devices: true)
    
    # Create missing code signing certs.
    cert
    
    # Sign code with provisioning profile. 
    sigh(adhoc: true)
    
    # Bump Xcode build number.
    increment_build_number(xcodeproj: "ios/AppName.xcodeproj")
    
    # Set Xcode app version.
    increment_version_number(
      version_number: JSON.parse(IO.read("../package.json"))["version"],
      xcodeproj: "ios/AppName.xcodeproj"
    )
    
    # Bundle React Native javascript. 
    sh "./bundle"
    
    # Build iOS app from source. 
    gym(scheme: "AppName", project: "ios/AppName.xcodeproj")
  end
end
```

Build the app and output to your project directory.

```
$ fastlane ios beta

fastlane.tools finished successfully 🎉
```

You should see the following outputs.

```
ios/main.jsbundle
ios/main.jsbundle.meta
AppName.app.dSYM.zip
AppName.ipa
AdHoc_com.mydomain.appname.mobileprovision
```

### Hockey App

You need a way to push new versions. The easiest way for me was via [Hockey App](https://hockeyapp.net/). Sign up for an API key and add your test device. In the Hockey App dashboard, go to Account Settings then API Tokens. Create a new token with privileges to upload new apps. 

Update your `./fastlane/Fastfile` to push to Hockey App on new builds.

```rb
  lane :beta do
    # ...
    hockey(api_key: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
  end
```

If the install fails with a generic message, it usually means your certificate or provisioning file is wrong. Make sure the device is in `./ios/devices.tsv` and your Xcode settings use the right provisioning profile and your `sigh()` command matches the Xcode settings. 

### TypeScript

If you want to use [TypeScript](https://www.typescriptlang.org/) instead of JavaScript, follow these instructions. 

```
$ yarn add typescript
$ yarn add @types/react
```

Add a `tsconfig.json` for React Native. I chose to put TypeScript source code in `./source` and output compiled JavaScript to `./dist`.

```json
{
	"compilerOptions": {
		"sourceMap": true,
		"moduleResolution": "node",
		"target": "es2015",
		"module": "es2015",
		"jsx": "react",
		"allowSyntheticDefaultImports": true,
		"rootDir": "source",
		"outDir": "dist",
		"allowJs": true,
		"baseUrl": "source",
		"types": [
			"react"
		]
	},
	"exclude": [
		"node_modules",
		"dist",
		"index.android.js",
		"index.ios.js"
	]
}
```

You probably want to ignore compiled JavaScript.

```
# .gitignore

/dist
```

Compile typescript in the `./fastlane/bundle` script.

```
#!/bin/bash

set -e

cd ..
tsc
react-native bundle --dev false --platform "ios" --entry-file "./index.ios.js" --bundle-output "./ios/main.jsbundle"
```

When developing, use the watch flag.

```
$ tsc --watch
```

Add a main application component.

```js
// source/AppName.tsx

export default class AppName extends Component<{}, {}>

// .. etc ..
```

Import compiled root ios and android app component classes.

```js
// index.ios.js

import { AppRegistry } from "react-native"
import AppName from "./dist/AppName"

AppRegistery.registerComponent("AppName", () => AppName)
```

React Native imports the compiled JavaScript. You get type safe code without fighting the build system. Bump the version in `package.json` and try out the new TypeScript build. 

```
$ fastlane ios beta
```

### Conclusion

I want to thank the Fastlane team for a *phenomenal* development tool. I was hesitant to build for native mobile because the release process was an unknown. I chose to solve incremental deployment first, and thanks to Fastlane I feel confident to start building out the app. 
