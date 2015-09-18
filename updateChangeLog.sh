#!/bin/sh

COM_LAST=`head -1 ChangeLog | cut -d " " -f 2`

echo "Downloading git log from commit $COM_LAST (excluded) to HEAD (included)" 

git log --decorate=no  --date=rfc $COM_LAST...HEAD > ChangeLog.new

cat "ChangeLog" >> "ChangeLog.new"

mv "ChangeLog.new" "ChangeLog"
