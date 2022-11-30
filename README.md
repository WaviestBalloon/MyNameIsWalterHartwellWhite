<p align="center">
	<img src="./assets/theberg.gif">
</p>

# My Name Is Walter Hartwell White

A website to tell your confession, and to see your IP, inspired by BattleOfWits

[A live-version is running on my server](https://niko.wav.blue/)

Support and fuel my stupidity by donating to my **[Patreon](patreon.com/WaviestBalloon)**

# Setup

- Clone the repository and open a terminal in the folder
- Run `npm i` to install the dependencies (`express`, `node-fetch`)
- Make sure to have ffmpeg installed (**not the NodeJS version!**), you can install it by running `sudo apt install ffmpeg` (unsure what you would do for Windows)
- Run walter by running `node .`
- **Optional**: See below for information on how to create a systemd service for walter so it will run under a daemon


# Add it as a systemd service

There is a `walter.service` file that contains a example configuration for Walter, you'll have to change this to your own configuration and move it into `/etc/systemd/system/`, for example using `mv ./walter.service /etc/systemd/system/`, then start it with `systemctl start walter.service`


# Support

Probably won't give out support for this, as it's just a little stupid thing, nothing special. If you really, *really*, **really** require help, create a issue


<br>


Re-written by Alek

My name is Walter Hartwell White. I live at 308 Negra Aroya Lane, Albuquerque, New Mexico, 87104.
