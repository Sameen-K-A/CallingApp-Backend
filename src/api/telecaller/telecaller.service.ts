import { ITelecallerRepository, ITelecallerService } from './telecaller.types'

export class TelecallerService implements ITelecallerService {
  constructor(private telecallerRepository: ITelecallerRepository) { }

};