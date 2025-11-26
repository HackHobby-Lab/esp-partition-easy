# ESP Partition Easy

**ESP Partition Easy** is a powerful Visual Studio Code extension designed to simplify the management of partition tables for ESP32 development boards. Say goodbye to manual CSV editing and hello to a visual, intuitive interface!

[![Get it on VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/hackhobbylab.esp-partition-easy?style=for-the-badge&label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://github.com/HackHobby-Lab/esp-partition-easy)

## Features

- **Visual Partition Editor**: View and edit your partition table with a clear, color-coded graphical interface.
- **Multi-Chip Support**: Compatible with **ESP32**, **ESP32-S2**, **ESP32-C3**, and **ESP32-S3**.
- **Smart Alignment**: Automatically aligns partition offsets to boundaries to ensure compatibility.
- **Overlap Detection**: Instantly detects and warns about overlapping partitions to prevent build errors.
- **Dynamic Flash Sizes**: Support for various flash sizes (4MB, 8MB, 16MB, 32MB).
- **CSV Integration**: Seamlessly reads from and writes back to your `partitions.csv` file.

## How to Use

1.  **Open a Partition File**:
    - Open your project in VS Code.
    - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and run **"ESP32 Partition Editor"**.
    - Select your `partitions.csv` file.

2.  **Edit Partitions**:
    - Use the table to modify partition names, types, subtypes, offsets, and sizes.
    - Click **"+ Add Partition"** to create new entries.
    - Adjust the **Flash Size** and **Chip Model** from the dropdowns to match your hardware.

3.  **Save Changes**:
    - Click the **"Save Changes"** button to write your modifications back to the CSV file.

## Contributing

This project is **Open Source**! I believe in the power of community.

If you have ideas for improvements, found a bug, or want to add a new feature, please contribute to make this tool even better for everyone.

[**Contribute on GitHub**](https://github.com/HackHobby-Lab/esp-partition-easy)

## Author

**Hamzah Awan**  
*HackHobby Lab*

Connect with me but don't Contact me :)  
[Instagram (@hackhobbylab)](https://instagram.com/hackhobbylab)

---
*Made with ❤️ for the ESP32 Community.*
