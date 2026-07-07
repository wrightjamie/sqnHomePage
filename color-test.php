<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAF Brand Color Tester</title>
    <link rel="stylesheet" href="css/core.css">
    <style>
        :root {
            /* Live custom variables for the preview */
            --test-bg: var(--raf-nav-2);
            --test-swoosh-div: var(--raf-supp-7);
            --test-footer: var(--raf-white);
            --test-main-heading: var(--raf-white);
            --test-text: var(--raf-white);
            --test-accent: var(--raf-accent-1);
            --test-swoosh-heading: var(--raf-logo-2);
        }

        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            display: flex;
            height: 100vh;
            overflow: hidden;
            background: #222; /* Dark theme for the editor portion */
            color: #fff;
        }

        /* The Control Panel */
        #editor-sidebar {
            width: 400px;
            background: #111;
            padding: 20px;
            box-sizing: border-box;
            overflow-y: auto;
            border-right: 1px solid #333;
            z-index: 50;
            flex-shrink: 0;
        }

        #editor-sidebar h2 {
            margin-top: 0;
            font-size: 1.2rem;
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
        }

        .control-group {
            margin-bottom: 20px;
        }

        .control-group label {
            display: block;
            font-size: 0.95rem;
            margin-bottom: 8px;
            color: #ccc;
            font-weight: bold;
        }

        /* Swatches */
        .swatches-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .color-swatch {
            width: 28px;
            height: 28px;
            border-radius: 4px;
            border: 2px solid transparent;
            cursor: pointer;
            box-shadow: 0 0 0 1px #444;
            transition: transform 0.1s;
        }

        .color-swatch:hover {
            transform: scale(1.1);
            z-index: 2;
        }

        .color-swatch.active {
            border-color: #fff;
            box-shadow: 0 0 0 2px #fff;
        }

        /* The Output Box */
        #output-box {
            margin-top: 30px;
            background: #000;
            padding: 10px;
            border: 1px solid #444;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.8rem;
            white-space: pre-wrap;
            color: #0f0;
            user-select: all;
        }

        /* The Preview Area */
        #preview-area {
            flex-grow: 1;
            position: relative;
            background: var(--test-bg);
            color: var(--test-text);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            padding: 60px;
            box-sizing: border-box;
            font-family: 'Inter', sans-serif; /* Fallback if not loaded */
        }

        /* Preview Elements */
        .preview-content {
            z-index: 10;
        }
        
        .preview-content h1 {
            color: var(--test-main-heading);
            font-size: 4rem;
            margin-top: 0;
            font-weight: 800;
        }

        .preview-content p {
            font-size: 1.5rem;
            max-width: 800px;
            line-height: 1.6;
        }

        .preview-accent {
            color: var(--test-accent);
            font-weight: bold;
        }

        /* Swoosh Footer */
        #swoosh-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 40vh; /* taller to accommodate the curve */
            z-index: 5;
            display: flex;
            align-items: flex-end;
        }
        #swoosh-footer svg {
            display: block;
            width: 100%;
            height: 100%;
            position: absolute;
            bottom: 0;
            left: 0;
        }
        
        .swoosh-inner { fill: var(--test-footer); }
        .swoosh-dividing { fill: var(--test-swoosh-div); }
        
        .footer-content {
            position: absolute;
            bottom: 30px;
            right: 50px;
            z-index: 10;
            text-align: right;
        }

        .footer-content h2 {
            color: var(--test-swoosh-heading);
            margin: 0;
            font-size: 2.5rem;
            font-weight: bold;
        }

    </style>
</head>
<body>

    <!-- Editor Sidebar -->
    <div id="editor-sidebar">
        <h2>RAF Colour Tester</h2>
        
        <div id="controls"></div>

        <div id="output-box"></div>
    </div>

    <!-- Live Preview -->
    <div id="preview-area">
        <div class="preview-content">
            <h1>Welcome to the Displayboard</h1>
            <p>This is some general text that describes what is happening on the display. We can also include some <span class="preview-accent">accented text</span> to highlight important information.</p>
        </div>

        <div id="swoosh-footer">
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none">
                <!-- Dividing Swoosh (The Ribbon) -->
                <!-- Starts low on left, dips slightly, swoops up to right -->
                <path class="swoosh-dividing" d="M 0,240 C 300,280 600,230 1000,100 L 1000,130 C 600,260 300,310 0,270 Z"></path>
                
                <!-- Inner Swoosh (The base shape) -->
                <path class="swoosh-inner" d="M 0,270 C 300,310 600,260 1000,130 L 1000,300 L 0,300 Z"></path>
            </svg>
            <div class="footer-content">
                <h2>Footer / Swoosh Heading</h2>
            </div>
        </div>
    </div>

    <script>
        // Array of available RAF colours
        const colors = [
            { name: "RAF Red", var: "--raf-logo-1" },
            { name: "Deep Blue", var: "--raf-logo-2" },
            { name: "Navigation 1", var: "--raf-nav-1" },
            { name: "Navigation 2", var: "--raf-nav-2" },
            { name: "Navigation 3", var: "--raf-nav-3" },
            { name: "Accent 1 (Orange)", var: "--raf-accent-1" },
            { name: "Accent 2 (Yellow)", var: "--raf-accent-2" },
            { name: "Accent 3 (Blue)", var: "--raf-accent-3" },
            { name: "Supporting 1", var: "--raf-supp-1" },
            { name: "Supporting 2", var: "--raf-supp-2" },
            { name: "Supporting 3", var: "--raf-supp-3" },
            { name: "Supporting 4", var: "--raf-supp-4" },
            { name: "Supporting 5", var: "--raf-supp-5" },
            { name: "Supporting 6", var: "--raf-supp-6" },
            { name: "Supporting 7", var: "--raf-supp-7" },
            { name: "Supporting 8", var: "--raf-supp-8" },
            { name: "Supporting 9", var: "--raf-supp-9" },
            { name: "White", var: "--raf-white" },
            { name: "Black", var: "--raf-black" } // Assume there might be a black or dark color, standard in core
        ];

        // Ensure white/black exist if not strictly in core
        document.documentElement.style.setProperty('--raf-white', '#FFFFFF');
        document.documentElement.style.setProperty('--raf-black', '#000000');

        const elements = [
            { id: 'bg', label: 'Page Background', cssVar: '--test-bg', defaultVar: '--raf-nav-2' },
            { id: 'swoosh-div', label: 'Swoosh Divider', cssVar: '--test-swoosh-div', defaultVar: '--raf-supp-7' },
            { id: 'footer', label: 'Footer (Inner Swoosh)', cssVar: '--test-footer', defaultVar: '--raf-white' },
            { id: 'main-heading', label: 'Main Heading', cssVar: '--test-main-heading', defaultVar: '--raf-white' },
            { id: 'text', label: 'General Text', cssVar: '--test-text', defaultVar: '--raf-white' },
            { id: 'accent', label: 'Accent Text', cssVar: '--test-accent', defaultVar: '--raf-accent-1' },
            { id: 'swoosh-heading', label: 'Swoosh Heading', cssVar: '--test-swoosh-heading', defaultVar: '--raf-logo-2' }
        ];

        const controlsContainer = document.getElementById('controls');
        const outputBox = document.getElementById('output-box');

        // Store selected values
        const selectedValues = {};

        function generateOutput() {
            let out = "Hey Antigravity, please apply these colours:\n\n";
            elements.forEach(el => {
                const varName = selectedValues[el.id];
                const colorObj = colors.find(c => c.var === varName);
                const colorName = colorObj ? colorObj.name : varName;
                out += `- ${el.label}: ${colorName} (${varName})\n`;
            });
            outputBox.textContent = out;
        }

        function updateColor(el, value, swatchElement, container) {
            // Update UI
            const swatches = container.querySelectorAll('.color-swatch');
            swatches.forEach(s => s.classList.remove('active'));
            swatchElement.classList.add('active');

            // Update CSS and State
            document.documentElement.style.setProperty(el.cssVar, `var(${value})`);
            selectedValues[el.id] = value;
            
            generateOutput();
        }

        elements.forEach(el => {
            selectedValues[el.id] = el.defaultVar; // Init state

            const group = document.createElement('div');
            group.className = 'control-group';
            
            const label = document.createElement('label');
            label.textContent = el.label;
            
            const swatchContainer = document.createElement('div');
            swatchContainer.className = 'swatches-container';

            colors.forEach(c => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = `var(${c.var})`;
                swatch.title = c.name;
                
                if (c.var === el.defaultVar) {
                    swatch.classList.add('active');
                }

                swatch.addEventListener('click', () => updateColor(el, c.var, swatch, swatchContainer));
                swatchContainer.appendChild(swatch);
            });

            group.appendChild(label);
            group.appendChild(swatchContainer);
            controlsContainer.appendChild(group);
            
            // Set initial inline var
            document.documentElement.style.setProperty(el.cssVar, `var(${el.defaultVar})`);
        });

        // Initial output generation
        generateOutput();

    </script>
</body>
</html>
