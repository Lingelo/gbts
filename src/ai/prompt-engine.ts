import type { GameBoyContext, PromptTemplate, TranspilationExample } from './types'

export class GameBoyPromptEngine {
  private baseTemplate: PromptTemplate

  constructor() {
    this.baseTemplate = this.createBaseTemplate()
  }

  buildPrompt(
    jsCode: string,
    context: GameBoyContext,
    examples: TranspilationExample[] = [],
  ): string {
    let prompt = this.baseTemplate.base
      .replace('{GAMEBOY_CONSTRAINTS}', this.buildConstraints(context))
      .replace('{GBDK_FUNCTIONS}', this.buildGBDKReference(context))
      .replace('{CONTEXT_INFO}', this.buildContextInfo(context))
      .replace('{OUTPUT_FORMAT}', this.baseTemplate.outputFormat)

    // Add examples if available
    if (examples.length > 0) {
      prompt = prompt.replace('{EXAMPLES}', this.buildExamples(examples))
    } else {
      prompt = prompt.replace('{EXAMPLES}', '')
    }

    // Add the actual code to convert
    prompt += `\n\nJAVASCRIPT/TYPESCRIPT CODE TO CONVERT:\n\`\`\`javascript\n${jsCode}\n\`\`\`\n`
    prompt += '\nConvert this to optimal GameBoy C code. Return ONLY the C code, no explanations or markdown formatting:'

    return prompt
  }

  private createBaseTemplate(): PromptTemplate {
    return {
      base: `You are an expert GameBoy C programmer and transpiler. Your job is to convert JavaScript/TypeScript code into highly optimized C code that runs efficiently on the Nintendo GameBoy.

{GAMEBOY_CONSTRAINTS}

{CONTEXT_INFO}

{GBDK_FUNCTIONS}

CONVERSION RULES:
1. Prefer unsigned char over int when possible (0-255 range)
2. Use signed char for small negative values (-128 to 127)
3. Avoid floating point operations (GameBoy has no FPU)
4. Minimize RAM usage - GameBoy only has 8KB work RAM
5. Use GBDK functions for hardware access
6. Convert console.log() to printf() with proper formatting
7. Convert arrays to C arrays with fixed sizes
8. Convert objects to structs when beneficial
9. Replace modern JS features with C equivalents
10. Optimize for size first, then speed

MEMORY OPTIMIZATION:
- Variables used frequently: consider zero page (0xFF80-0xFFFE)
- Constants: place in ROM with __code qualifier
- Large data: consider ROM banking if needed
- Temporary variables: use stack/registers when possible

{EXAMPLES}

{OUTPUT_FORMAT}`,

      gameboyConstraints: `GAMEBOY HARDWARE CONSTRAINTS:
- CPU: 8-bit Sharp LR35902 (Z80-like) at 4.194 MHz
- RAM: 8KB work RAM (0xC000-0xDFFF)
- Video RAM: 8KB (0x8000-0x9FFF)
- High RAM: 127 bytes (0xFF80-0xFFFE) - fastest access
- ROM: 32KB per bank (banking available for larger programs)
- No floating point unit - use fixed point arithmetic
- Limited stack space - avoid deep recursion`,

      examples: '',

      contextualInstructions: '',

      outputFormat: `OUTPUT FORMAT:
- Return ONLY valid C code
- Include necessary #include statements
- Use GBDK function calls for hardware access
- Add brief comments for complex operations
- Ensure code compiles with GBDK
- No markdown formatting or explanations`,
    }
  }

  private buildConstraints(context: GameBoyContext): string {
    const constraints = [
      `TARGET: ${context.target.toUpperCase()} (${this.getTargetDescription(context.target)})`,
      `AVAILABLE RAM: ${context.availableRAM}KB`,
      `CURRENT ROM BANK: ${context.currentBank}`,
      `OPTIMIZATION FOCUS: ${context.optimizeFor}`,
      `ENABLED FEATURES: ${context.features.join(', ')}`,
    ]

    return constraints.join('\n')
  }

  private buildContextInfo(context: GameBoyContext): string {
    let info = 'CONTEXT INFORMATION:\n'

    if (context.memoryLayout) {
      info += `- Zero page variables: ${context.memoryLayout.zeroPage.join(', ')}\n`
      info += `- Work RAM variables: ${context.memoryLayout.workRam.join(', ')}\n`
      if (context.memoryLayout.ramBank) {
        info += `- RAM bank: ${context.memoryLayout.ramBank}\n`
      }
    }

    if (context.optimizeFor === 'size') {
      info += '- PRIORITY: Minimize ROM/RAM usage\n'
      info += '- Use shortest variable types possible\n'
      info += '- Favor code density over execution speed\n'
    } else if (context.optimizeFor === 'speed') {
      info += '- PRIORITY: Maximize execution speed\n'
      info += '- Use zero page for frequently accessed variables\n'
      info += '- Unroll small loops when beneficial\n'
    }

    return info
  }

  private buildGBDKReference(context: GameBoyContext): string {
    const gbdkFunctions = [
      '// DISPLAY FUNCTIONS',
      'void set_bkg_tiles(UINT8 x, UINT8 y, UINT8 w, UINT8 h, unsigned char *tiles);',
      'void set_bkg_data(UINT8 first_tile, UINT8 nb_tiles, unsigned char *data);',
      'void move_bkg(UINT8 x, UINT8 y);',
      'void scroll_bkg(INT8 x, INT8 y);',
      '',
      '// SPRITE FUNCTIONS',
      'void set_sprite_data(UINT8 first_tile, UINT8 nb_tiles, unsigned char *data);',
      'void set_sprite_tile(UINT8 nb, UINT8 tile);',
      'void move_sprite(UINT8 nb, UINT8 x, UINT8 y);',
      'void set_sprite_prop(UINT8 nb, UINT8 prop);',
      '',
      '// INPUT FUNCTIONS',
      'UINT8 joypad(void);',
      'UINT8 waitpad(UINT8 mask);',
      'void waitpadup(void);',
      '',
      '// SYSTEM FUNCTIONS',
      'void wait_vbl_done(void);',
      'void delay(UINT16 d);',
      'void enable_interrupts(void);',
      'void disable_interrupts(void);',
      '',
      '// DISPLAY CONTROL',
      '#define DISPLAY_ON    0x80U',
      '#define DISPLAY_OFF   0x00U',
      '#define SHOW_BKG      0x01U',
      '#define HIDE_BKG      0x00U',
      '#define SHOW_SPRITES  0x02U',
      '#define HIDE_SPRITES  0x00U',
      '',
      '// JOYPAD CONSTANTS',
      '#define J_A      0x01U',
      '#define J_B      0x02U',
      '#define J_SELECT 0x04U',
      '#define J_START  0x08U',
      '#define J_RIGHT  0x10U',
      '#define J_LEFT   0x20U',
      '#define J_UP     0x40U',
      '#define J_DOWN   0x80U',
    ]

    // Filter functions based on enabled features
    let filteredFunctions = gbdkFunctions

    if (!context.features.includes('sprites')) {
      filteredFunctions = filteredFunctions.filter(line =>
        !line.includes('sprite') && !line.includes('SPRITE'))
    }

    if (!context.features.includes('background')) {
      filteredFunctions = filteredFunctions.filter(line =>
        !line.includes('bkg') && !line.includes('BKG'))
    }

    return `AVAILABLE GBDK FUNCTIONS:\n\`\`\`c\n${filteredFunctions.join('\n')}\n\`\`\``
  }

  private buildExamples(examples: TranspilationExample[]): string {
    let exampleText = '\n\nEXAMPLES OF GOOD CONVERSIONS:\n'

    examples.slice(0, 3).forEach((example, index) => {
      exampleText += `\nExample ${index + 1}:\nJavaScript:\n\`\`\`javascript\n${example.jsCode}\n\`\`\`\n`
      exampleText += `GameBoy C:\n\`\`\`c\n${example.cCode}\n\`\`\`\n`
    })

    return exampleText
  }

  private getTargetDescription(target: string): string {
    switch (target) {
      case 'dmg': return 'Original GameBoy, monochrome'
      case 'cgb': return 'GameBoy Color, color support'
      case 'sgb': return 'Super GameBoy, enhanced features'
      default: return 'GameBoy compatible'
    }
  }

  // Create specialized prompts for different code patterns
  createSpecializedPrompt(jsCode: string, codeType: 'game-loop' | 'sprite-animation' | 'input-handling' | 'data-structure'): string {
    const basePrompt = this.buildPrompt(jsCode, {
      target: 'dmg',
      availableRAM: 8,
      currentBank: 1,
      features: ['sprites', 'background', 'sound', 'interrupts'],
      optimizeFor: 'balance',
    })

    switch (codeType) {
      case 'game-loop':
        return `${basePrompt}\n\nSPECIAL FOCUS: This is a game loop. Optimize for 60fps performance, use wait_vbl_done() for timing.`

      case 'sprite-animation':
        return `${basePrompt}\n\nSPECIAL FOCUS: This handles sprite animation. Use GBDK sprite functions efficiently, minimize VRAM updates.`

      case 'input-handling':
        return `${basePrompt}\n\nSPECIAL FOCUS: This handles input. Use joypad() function, implement proper debouncing if needed.`

      case 'data-structure':
        return `${basePrompt}\n\nSPECIAL FOCUS: This manages data structures. Optimize for GameBoy memory constraints, use fixed-size arrays.`

      default:
        return basePrompt
    }
  }
}