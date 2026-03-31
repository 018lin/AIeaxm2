export type MultipartInitRequest = {
  fileName: string
  fileSize: number
  contentType?: string
}

export type MultipartInitResponse = {
  uploadId: string
}

export type MultipartUploadPartRequest = {
  uploadId: string
  partNumber: number
  content: string
  fileName?: string
}

export type MultipartUploadPartResponse = any

export type MultipartCompleteRequest = {
  uploadId: string
}

export type MultipartCompleteResponse = any

export type MultipartAbortRequest = {
  uploadId: string
}

export type MultipartAbortResponse = any

export type MultipartProgressRequest = {
  uploadId: string
}

export type MultipartProgressResponse = any

