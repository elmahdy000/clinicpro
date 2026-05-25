import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../../prisma/tenant-context';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let clinicId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = jwt.decode(token) as any;
        if (payload && payload.clinicId) {
          clinicId = payload.clinicId;
        }
      } catch (e) {}
    }
    
    tenantStorage.run({ clinicId }, () => next());
  }
}
