import { BaseController } from '../../utils/baseController';
import { ITelecallerService } from './telecaller.types';

export class TelecallerController extends BaseController {
  constructor(private telecallerService: ITelecallerService) {
    super();
  };

};