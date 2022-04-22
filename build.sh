echo
echo "checking code.ts with airbnb eslint"
if npx eslint code.ts
then
  echo "done"
else
  exit
fi
echo
#
echo "transpiling code.ts"
if tsc
then
  echo "done"
else
  exit
fi
echo