#!/bin/bash
curl -X POST "https://kindredsouls.vercel.app/api/ai-insight" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"d1":"1990-05-15","d2":"1992-08-20","overall":75,"dims":{"love":80,"communication":70,"chemistry":85,"stability":60},"bazi":"test","zodiac":"test","iching":"test","lang":"vi","baziMeta":["test"],"zodiacMeta":["test"],"ichingMeta":["test"]}' \
  -v 2>&1
