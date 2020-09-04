import {ErrorObject} from "../types"

const resolve = require("./resolve")

export class ValidationError extends Error {
  errors: ErrorObject[]
  ajv: true
  validation: true

  constructor(errors: ErrorObject[]) {
    super("validation failed")
    this.errors = errors
    this.ajv = this.validation = true
  }
}

export class MissingRefError extends Error {
  missingRef: string
  missingSchema: string

  static message(baseId: string, ref: string): string {
    return `can't resolve reference ${ref} from id ${baseId}`
  }

  constructor(baseId: string, ref: string, message?: string) {
    super(message || MissingRefError.message(baseId, ref))
    this.missingRef = resolve.url(baseId, ref)
    this.missingSchema = resolve.normalizeId(resolve.fullPath(this.missingRef))
  }
}

module.exports = {
  ValidationError,
  MissingRefError,
}