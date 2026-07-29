import assert from 'node:assert/strict';
import test from 'node:test';
import { getBadgeStudioCopy } from './badgeStudioCopy.js';

test('badge studio selects a complete Chinese interface without changing the English default', () => {
  const english = getBadgeStudioCopy('en');
  const chinese = getBadgeStudioCopy('zh');

  assert.equal(english.title, 'Badge Studio');
  assert.equal(english.steps.join(','), 'Upload,Customize,Arrange,Details,Finish');
  assert.equal(chinese.designs.quality.good, '良好');
  assert.equal(chinese.title, '徽章设计室');
  assert.equal(chinese.steps.join(','), '上传,调整,排版,资料,完成');
  assert.equal(chinese.upload.choosePhotos, '选择照片');
  assert.equal(chinese.canvas.replacePhoto, '更换照片');
  assert.equal(chinese.arrange.empty, '空白');
  assert.equal(chinese.details.name, '姓名 *');
  assert.equal(chinese.finish.contactWhatsapp, '通过 WhatsApp 联系 Ashlife');
});

test('badge studio falls back to English for an unsupported language', () => {
  assert.equal(getBadgeStudioCopy('ms').title, 'Badge Studio');
});
