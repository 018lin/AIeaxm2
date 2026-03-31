import { requestGet, requestPost } from '@/api/index'
import type {
  MultipartAbortRequest,
  MultipartAbortResponse,
  MultipartCompleteRequest,
  MultipartCompleteResponse,
  MultipartInitRequest,
  MultipartInitResponse,
  MultipartProgressRequest,
  MultipartProgressResponse,
  MultipartUploadPartRequest,
  MultipartUploadPartResponse,
} from './type'

export function multipartInit(params: MultipartInitRequest) {
  return requestPost<MultipartInitResponse, MultipartInitRequest>('/api/v1/file/multipart/init', params)
}

export function multipartUploadPart(params: MultipartUploadPartRequest) {
  return requestPost<MultipartUploadPartResponse, MultipartUploadPartRequest>('/api/v1/file/multipart/upload-part', params)
}

export function multipartComplete(params: MultipartCompleteRequest) {
  return requestPost<MultipartCompleteResponse, MultipartCompleteRequest>('/api/v1/file/multipart/complete', params)
}

export function multipartAbort(params: MultipartAbortRequest) {
  return requestPost<MultipartAbortResponse, MultipartAbortRequest>('/api/v1/file/multipart/abort', params)
}

export function multipartProgress(params: MultipartProgressRequest) {
  return requestGet<MultipartProgressResponse, MultipartProgressRequest>('/api/v1/file/multipart/progress', params)
}

export * from './type'

