import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateGenerationDto {
  @IsString()
  templateId: string;

  @IsString()
  @IsIn(['TEMPLATE', 'ID_PHOTO', 'PORTRAIT'])
  generationType: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  aiParams?: Record<string, any>;
}
