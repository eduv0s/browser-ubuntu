#!/usr/bin/env bash
set -euo pipefail
mkdir -p public/assets/{bios,images,emulator}
curl -L --fail -o public/assets/bios/seabios.bin https://raw.githubusercontent.com/copy/v86/master/bios/seabios.bin
curl -L --fail -o public/assets/bios/vgabios.bin https://raw.githubusercontent.com/copy/v86/master/bios/vgabios.bin
curl -L --fail -o public/assets/images/TinyCore-11.0.iso https://distro.ibiblio.org/tinycorelinux/11.x/x86/archive/11.0/TinyCore-11.0.iso
cp node_modules/v86/build/v86.wasm public/assets/emulator/v86.wasm
echo 'Tiny Core Linux 11 x86 is GPL-2.0-or-later; verify the upstream checksum before publishing.'
