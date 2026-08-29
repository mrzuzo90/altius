import { describe, expect, it } from "vitest";
import { parseRssFeed } from "@/lib/news";

describe("Módulo de Noticias y Hechos Relevantes", () => {
  it("parsea feeds RSS XML de noticias correctamente", () => {
    const sampleXml = `
      <rss version="2.0">
        <channel>
          <title>Google News - AAPL</title>
          <item>
            <title><![CDATA[Apple Unveils New AI Features - Bloomberg]]></title>
            <link>https://www.bloomberg.com/news/articles/apple-ai</link>
            <pubDate>Sun, 23 Aug 2026 09:30:00 GMT</pubDate>
            <description>&lt;a href=&quot;https://www.bloomberg.com/news/articles/apple-ai&quot;&gt;Apple Inc. announced updates to its artificial intelligence stack.&lt;/a&gt;</description>
            <source>Bloomberg</source>
          </item>
          <item>
            <title>Apple Quarterly Earnings Beat Estimates - Reuters</title>
            <link>https://www.reuters.com/technology/apple-earnings</link>
            <pubDate>Sat, 22 Aug 2026 14:15:00 GMT</pubDate>
            <description>Revenue grew 8% year-over-year.</description>
          </item>
        </channel>
      </rss>
    `;

    const items = parseRssFeed(sampleXml);
    expect(items.length).toBe(2);

    expect(items[0].title).toBe("Apple Unveils New AI Features");
    expect(items[0].source).toBe("Bloomberg");
    expect(items[0].url).toBe("https://www.bloomberg.com/news/articles/apple-ai");
    expect(items[0].summary).toBe("Apple Inc. announced updates to its artificial intelligence stack.");
    expect(items[0].summary).not.toContain("http");
    expect(items[0].category).toBe("market");

    expect(items[1].title).toBe("Apple Quarterly Earnings Beat Estimates");
    expect(items[1].source).toBe("Reuters");
    expect(items[1].category).toBe("earnings");
  });

  it("gestiona feeds XML vacíos o malformados sin lanzar excepciones", () => {
    expect(parseRssFeed("")).toEqual([]);
    expect(parseRssFeed("<invalid>xml</invalid>")).toEqual([]);
  });
});
