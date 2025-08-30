import { createSpinner } from 'nanospinner'

export class Logger {
  private static spinner = createSpinner('', {
    color: 'yellow',
    frames: ['···', '•··', '••·', '•••'],
    interval: 500,
  })

  private static currentSpinner = false

  public static success(text: string) {
    if (this.currentSpinner) {
      this.spinner.success({ text })
      this.currentSpinner = false
    } else {
      console.log(`✅ ${text}`)
    }
  }

  public static error(text: string) {
    if (this.currentSpinner) {
      this.spinner.error({ text })
      this.currentSpinner = false
    } else {
      console.log(`❌ ${text}`)
    }
  }

  public static startLoading(text: string) {
    this.spinner.start({ text })
    this.currentSpinner = true
  }

  public static stopLoading() {
    if (this.currentSpinner) {
      this.spinner.stop()
      this.currentSpinner = false
    }
  }

  public static info(text: string) {
    if (this.currentSpinner) {
      this.spinner.update({ text })
    } else {
      console.log(`ℹ️ ${text}`)
    }
  }

  public static warn(text: string) {
    if (this.currentSpinner) {
      this.spinner.warn({ text })
      this.currentSpinner = false
    } else {
      console.log(`⚠️ ${text}`)
    }
  }
}
