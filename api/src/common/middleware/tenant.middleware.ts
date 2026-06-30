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
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET not set');
        const payload = jwt.verify(token, secret) as any;
        // Only access tokens may set tenant context. A refresh token carries clinicId too,
        // but it is signed with a different secret so jwt.verify above would already reject it;
        // this guard is belt-and-suspenders in case the secrets are ever the same.
        if (payload && payload.type !== 'refresh' && payload.clinicId) {
          clinicId = payload.clinicId;
        }
      } catch (e) {}
    }
    
    tenantStorage.run({ clinicId }, () => next());
  }
}
