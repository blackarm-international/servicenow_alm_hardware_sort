echo
echo "checking basic.ts with airbnb eslint"
if npx eslint basic.ts
then
  echo "done"
else
  exit
fi
echo
#
echo "transpiling basic.ts"
if npx tsc
then
  echo "done"
else
  exit
fi
echo