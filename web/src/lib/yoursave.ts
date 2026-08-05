import { yoursaveEvm } from '@/lib/yoursave.evm'
import { yoursaveMock } from '@/lib/yoursave.mock'
import { CONTRACT_ID } from '@/lib/config'
import type { YourSaveService } from '@/lib/types'

export const yoursave: YourSaveService = CONTRACT_ID === '' ? yoursaveMock : yoursaveEvm
