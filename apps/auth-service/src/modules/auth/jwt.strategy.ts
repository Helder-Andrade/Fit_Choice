import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    
    
    constructor(configService: ConfigService) {
        super({
            
            // Extracts JWT Token
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')!,
            //"jwt_FitChoice_fc.16.12",
        });
    }

    
    async validate(payload: any) {
        return { userId: payload.sub, email: payload.email };
    }
}