#!/bin/sh

script_dir=$(CDPATH= cd -P "$(dirname "$0")" && pwd) || exit 1
exec node "$script_dir/install.mjs" "$@"
