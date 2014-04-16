So your app needs push notifications? Book a day, invest in a stress ball. Shoutout to Anthony Guay ([@anthoprotic](https://twitter.com/anthoprotic)) for spending all morning on Xcode with me getting it to work!

### Certificate Request

There's stuff online about this part, so just quickly:

1. Open Keychain

2. In the menu "Keychain Access" > "Certificate Assistant" > "Request A Certificate From A Certificate Authority"

3. Enter email address & common name, click save to disk.

4. In Keychain, select the private key under "keys" menu. Double-click export as a P12. 

### Convert And Submit

The certificate needs to be in plain-text (aka PEM) form. 

Note: replace aps_development_4.cer with your certificate filename.

```
$ openssl x509 -in aps_development_4.cer -inform der -out cert.pem
```

Check it worked.

```
$ cat cert.pem
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
```

Next convert the private key to plain-text as well. You need to specify a password. If you want, the password can be stripped later. 

Note: replace appname.pk with your private key filename. 

```
$ openssl pkcs12 -nocerts -in appname.pk -out key.pem
Enter Import Password: 
MAC verified OK
```

If you get the wrong password, just try again.

```
Mac verify error: invalid password?
```

You'll be prompted for the PEM pass phrase (password). Remember it. 

```
Enter PEM pass phrase: ******
Verifying - Enter PEM pass phrase: ******
```

Register the key and cert with Apple's servers. It's a different url for production, this one is development.

```
$ openssl s_client -connect gateway.sandbox.push.apple.come:2195 \
	   -cert cert.pem -key key.pem
Enter pass phrase for key.pem:
CONNECTED(00000003)
...
---
```

Type some chars and press enter, you'll exit from the command. 

### Prepare The App

1. Open up Xcode and navigate to the project. 

2. Navigate to: "Provisioning Profiles" > "+ (new)" > "Development" > "Select App" > "Select Certificate" > "Select Device" > "Name Profile" > "Download"

3. Open the .mobileprovision file in the downloads folder. Confirm add to library. 

4. Navigate to: "Project Navigator" > "Target" > "Build Settings" > "Code Signing" > "Provisioning Profile"

5. Clean, Build, and Run

6. Get your device token with the following code:

```objective-c
// AppDelegate.m

- (void)applicationDidFinishLaunching:(UIApplication *)application {
  // ...

  [[UIApplication sharedApplication] registerForRemoteNotificationTypes:(UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound)];
}

- (void)application:(UIApplication *)application
didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
    NSLog(@"application:didRegisterForRemoteNotificationsWithDeviceToken: %@", deviceToken);

    // Register the device token with a webservice
}

- (void)application:(UIApplication *)application
didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
    NSLog(@"Error: %@", error);
}
```

The token should look like:

```
<6e9ea4cd ca021711 957b3bed 8cb3f1a7 243ce86f 4eb9e40b 847b775a ********>
```

### Push With Houston

Combine the cert and key. Order is important. 

```
$ cat cert.pem key.pem > appname.pem
```

Install the rubygem houston, which installs a command line tool apn.

```
$ gem install houston
```

Check out the options and usage.

```
$ apn push -h
```

Then push a notification!

```
$ token="<token here>"
$ apn push "$token" -c appname.pem -m "testing testing" -p
Password: *****
1 push notification sent successfully
```

If you get the following error, your password is wrong.

```
Exception sending notification: Neither PUB key nor PRIV key:: nested asn1 error
```

If you get the following error, you messed up the certificate and key process.

```
Exception: nested asn1 error
```

To strip the passphrase from the key:

```
$ mv key.pem key.bak.pem
$ openssl rsa -in key.bak.pem -out key.pem
Enter pass phrase for key.bak.pem:
```

Now you wont need to deal with the password aspect. Inspecting the source, the passphrase can also be set with the environment variable `APN_CERTIFICATE_PASSPHRASE`. 

That should be it! Tweet [@aj0strow](https://twitter.com/aj0strow) if you run into trouble; hopefully I can help. 