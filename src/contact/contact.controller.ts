import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Sub } from '../common/decorator/sub.decorator';
import { CreateContactDto } from '../common/dtos/contact/create-contact.dto';
import { ContactService } from './contact.service';
import { DeleteContactDto } from '../common/dtos/contact/delete-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}
  @Post()
  createContact(@Sub() sub: string, @Body() dto: CreateContactDto) {
    return this.contactService.createContact(sub, dto.phone, dto.email);
  }
  @Delete()
  removeContact(@Sub() sub: string, @Body() dto: DeleteContactDto) {
    return this.contactService.removeContact(sub, dto.otherId);
  }
  @Get('')
  getContact(@Sub() sub: string) {
    return this.contactService.getContacts(sub);
  }
}
