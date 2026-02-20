import { SetMetadata } from '@nestjs/common';

export const public_key = 'isPublic';
export const Public = () => SetMetadata(public_key, true);
