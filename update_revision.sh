#!/bin/sh

GITHUB="jenslody-gnome-shell-extension-weather"
BASE_URL="https://github.com/jenslody/gnome-shell-extension-weather/tarball/master/"
TARBALL_PATH="/home/jens/rpmbuild/SOURCES/"
SPEC_PATH="/home/jens/rpmbuild/SPECS/"
SPEC_FILE="gnome-shell-extension-openweather.spec"

SCRIPT_DIR=`dirname "$0"`
#echo "x${SCRIPT_DIR}x"
SCRIPT_DIR=`( cd "$SCRIPT_DIR" && pwd )`
#echo "y${SCRIPT_DIR}y"


if test -z "$1"; then
    branch="master"
else
    branch="$1"
fi


# make sure git answers in english
export LC_ALL="C"

# let's import OLD_REV (if there)
if [ -f ./.last_commit ]; then
	. ./.last_commit
else
	OLD_COMMIT=0
fi

cd "$SCRIPT_DIR"

git checkout $branch
git pull
echo "Using 'git log -1' to get the newest commit"
COMMIT=`git log -1 --pretty=format:"%h"`

echo "Found revision: '${COMMIT}'"

mv ${SPEC_FILE} ${SPEC_FILE}.tmp
sed "1 s/%global git .*/%global git $COMMIT/" < ${SPEC_FILE}.tmp > ${SPEC_FILE}
rm -f ${SPEC_FILE}.tmp
cp ${SPEC_FILE} ${SPEC_PATH}${SPEC_FILE}

rm -f ${TARBALL_PATH}${GITHUB}-*.tar.gz
wget -c ${BASE_URL}${GITHUB}-${COMMIT}.tar.gz -O ${TARBALL_PATH}${GITHUB}-${COMMIT}.tar.gz

cd ${SPEC_PATH}
rm -f ../SRPMS/${GITHUB}*.src.rpm
rpmbuild -bs ${SPEC_FILE}

echo "OLD_COMMIT=$COMMIT" > ./.last_commit

exit 0
