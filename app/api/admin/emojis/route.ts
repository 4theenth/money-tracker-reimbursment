import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'lib', 'config', 'emojis.ts')
    const content = fs.readFileSync(configPath, 'utf-8')
    
    // Extract emoji array from file
    const match = content.match(/export const emojiOptions = \[([\s\S]*?)\]/)
    if (!match) {
      return NextResponse.json({ error: 'Failed to parse emoji config' }, { status: 500 })
    }
    
    const emojiString = match[1]
    const emojis = emojiString
      .split(',')
      .map(e => e.trim().replace(/['"]/g, '').replace(/\/\/.*/g, ''))
      .filter(e => e.length > 0 && !e.startsWith('//'))
    
    return NextResponse.json({ emojis })
  } catch (error) {
    console.error('Error reading emoji config:', error)
    return NextResponse.json({ error: 'Failed to read emoji config' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { emojis } = await request.json()
    
    if (!Array.isArray(emojis)) {
      return NextResponse.json({ error: 'Invalid emoji array' }, { status: 400 })
    }
    
    // Validate: only emojis (filter out non-emoji items)
    const emojiRegex = /\p{Emoji}/u
    const validEmojis = emojis.filter(e => {
      // Must be non-empty and contain at least one emoji
      return e && typeof e === 'string' && e.trim().length > 0 && emojiRegex.test(e)
    })
    
    if (validEmojis.length === 0) {
      return NextResponse.json({ 
        error: 'No valid emoji found', 
        message: 'Please provide at least one emoji'
      }, { status: 400 })
    }
    
    // Remove duplicates
    const uniqueEmojis = [...new Set(validEmojis)]
    
    // Generate new config file content with ALL emojis (dynamic)
    // Format: 8 emoji per line for readability
    const lines = []
    for (let i = 0; i < uniqueEmojis.length; i += 8) {
      const chunk = uniqueEmojis.slice(i, i + 8)
      lines.push(`  ${chunk.map(e => `'${e}'`).join(', ')}${i + 8 < uniqueEmojis.length ? ',' : ''}`)
    }
    const emojiList = lines.join('\n')
    
    const newContent = `/**
 * Emoji Picker Configuration
 * Manage emoji options for category management
 * Edit via: /admin/emoji-manager
 * Last updated: ${new Date().toISOString()}
 */

export const emojiOptions = [
${emojiList}
]

export const defaultEmojiOptions = [...emojiOptions] // Backup for reset
`
    
    // Write to file
    const configPath = path.join(process.cwd(), 'lib', 'config', 'emojis.ts')
    fs.writeFileSync(configPath, newContent, 'utf-8')
    
    return NextResponse.json({ 
      success: true, 
      count: uniqueEmojis.length,
      message: 'Emoji config updated successfully' 
    })
  } catch (error) {
    console.error('Error updating emoji config:', error)
    return NextResponse.json({ error: 'Failed to update emoji config' }, { status: 500 })
  }
}
