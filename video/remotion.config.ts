import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
// H.264 in an MP4 is the one combination every phone, WhatsApp and Instagram
// will play without re-encoding it themselves and softening it.
Config.setCodec('h264');
Config.setOverwriteOutput(true);
