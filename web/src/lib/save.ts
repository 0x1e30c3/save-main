import { saveEvm } from '@/lib/save.evm'
import { saveMock } from '@/lib/save.mock'
import { CONTRACT_ID } from '@/lib/config'
import type { SaveService } from '@/lib/types'

export const save: SaveService = CONTRACT_ID === '' ? saveMock : saveEvm

