import { saveMock } from '@/lib/save.mock'
import { saveReal } from '@/lib/save.real'
import { CONTRACT_ID } from '@/lib/config'
import type { SaveService } from '@/lib/types'

export const save: SaveService = CONTRACT_ID === '' ? saveMock : saveReal
